import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import { Order, Manifest as manifest } from "@pythias/mongo";
import axios from "axios"
import { Bin } from "@pythias/mongo";
import {updateOrder, createReceiptShipment, shipOrderFaire, shipOrderWalmart, getOrderWalmart, shipOrderEbay, fulfillShipAdviceAcenda} from "@pythias/integrations";
import { createShipment as ceCreateShipment } from "@/functions/channelEngine";
import { shipOrderTikTok } from "@/functions/tikTok";
import {ApiKeyIntegrations, Item as Items} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange, logError } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";
import { postProviderStatus } from "@/functions/notifyPlatform";
export async function POST(req= NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    console.log(data)
    if(!data.address.country) data.address.country = "US"

    // Training-mode gate (server-side, can't be bypassed): a trainee must have scanned every item in
    // the order before a shipping label will print. Set via the user's `permissions.shipTraining`.
    if (token?.permissions?.shipTraining) {
        const tItems = await Items.find({ order: data.orderId, canceled: { $ne: true } }).select("pieceId").lean();
        const required = tItems.map(i => String(i.pieceId || "").toUpperCase()).filter(Boolean);
        const scannedSet = new Set((data.scannedPieceIds || []).map(p => String(p || "").toUpperCase()));
        const missing = required.filter(p => !scannedSet.has(p));
        if (!required.length || missing.length) {
            return NextResponse.json({ error: true, msg: `Training mode: scan all ${required.length} item(s) before shipping — ${missing.length} not scanned.` });
        }
    }

    const sc = await getShippingCreds();
    const stationCfg = sc.stations.find(s => s.name === data.station);
    const stationFormat = stationCfg?.format ?? "PDF";
    const printEndpoint = stationFormat === "ZPL" ? "printers" : "cpu";

    // Commerce Cloud orders ship blind under the seller's return address (not Premier's).
    const ccOrder = await Order.findById(data.orderId).select("marketplace returnAddress").lean();
    const clientReturnAddress = (ccOrder?.marketplace === "Commerce Cloud" && ccOrder.returnAddress?.address)
        ? ccOrder.returnAddress
        : null;

    const buyOpts = {
        ...data,
        imageType: stationFormat,
        businessAddress: clientReturnAddress
            ? clientReturnAddress
            : data.marketplace == "TCS" ? { name: "TSC Distribution Center", businessName: "ATTN: Online Orders", address: "100 Rains Drive", city: "Fanklin", state: "KY", postalCode: "42134", country: "US" } : sc.businessAddress,
        providers: ["usps", "ups"],
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsFedExNew: sc.credentialsFedExNew,
        credentialsUPS: sc.credentialsUPS,
        credentialsDHL: sc.credentialsDHL,
        thirdParty: data.marketplace?.trim() == "Zulily" ? process.env.upsZulily : data.marketplace?.trim() == "TSC" ? process.env.upsTSC : null,
        credentialsShipStation: sc.credentialsShipStation,
        imageFormat: stationFormat,
        carrierCodes: sc.carrierCodes,
        warehouse_id: sc.warehouse_id,
    };

    try {
        // Multi-box: buy a label per package; single-box: buy one label
        const pkgs = data.packages?.length > 1 ? data.packages : [{ weight: data.weight, dimensions: data.dimensions }];
        const purchasedLabels = [];
        for (const pkg of pkgs) {
            const lbl = await buyLabel({ ...buyOpts, weight: pkg.weight, dimensions: pkg.dimensions });
            if (lbl.error) return NextResponse.json(lbl);
            purchasedLabels.push(lbl);
        }
        const primaryLabel = purchasedLabels[0];
        const totalCost = purchasedLabels.reduce((s, l) => s + parseFloat(l.cost || 0), 0);

        let order = await Order.findOne({_id: data.orderId}).populate("items")
        const beforeStatus = order.status;
        try {
            await updateOrder({auth: sc.shipstationAuth, orderId:order.orderId, carrierCode: "usps", trackingNumber: primaryLabel.trackingNumber})
        } catch(e) { console.error("ShipStation update failed:", e.message); }
        order.shippingInfo.label = primaryLabel.label;
        order.shippingInfo.shippingCost += totalCost;
        order.shippingInfo.shippedAt = new Date();
        order.status = "Shipped";
        for (const lbl of purchasedLabels) {
            if (data.selectedShipping.provider == "usps") {
                await new manifest({ pic: lbl.trackingNumber, Date: new Date() }).save();
            }
            order.shippingInfo.labels.push({
                trackingNumber: lbl.trackingNumber,
                label: lbl.label,
                cost: parseFloat(lbl.cost || 0),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping.provider,
                format: stationFormat,
            });
        }
        // Mark EVERY item belonging to this order (by order ref, not the populated order.items array
        // which can be stale/incomplete — a missed piece leaves it shipped:false and the order looking
        // unshipped). Keep the `shipped` boolean + `status` in sync; reports key off the boolean.
        await Items.updateMany(
            { order: order._id, canceled: { $ne: true } },
            { $set: { shipped: true, shippedDate: new Date(), status: "Shipped" }, $push: { steps: { status: "Shipped", date: new Date() } } }
        );
        order = await order.save();
        logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email });
        logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", action: "label_purchased", before: { status: beforeStatus }, after: { status: "Shipped", trackingNumber: primaryLabel.trackingNumber, carrier: data.selectedShipping.provider, cost: totalCost, packages: pkgs.length }, userName, email, provider: "premierPrinting" });
        if (order.marketplace?.toLowerCase() === "etsy" && order.marketplaceOrderId) {
            try {
                const etsyConn = await ApiKeyIntegrations.findOne({ type: "etsy" });
                if (etsyConn) await createReceiptShipment(etsyConn, order.marketplaceOrderId, primaryLabel.trackingNumber, data.selectedShipping.provider);
            } catch (e) { console.error("Failed to update Etsy shipment:", e.message); }
        }
        if (order.marketplace?.toLowerCase() === "faire" && order.marketplaceOrderId) {
            try {
                const faireConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId) ?? await ApiKeyIntegrations.findOne({ type: "faire" });
                if (faireConn) {
                    const FAIRE_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FEDEX", dhl: "DHL_EXPRESS" };
                    await shipOrderFaire({ apiKey: faireConn.apiKey, orderId: order.marketplaceOrderId, shipments: [{ carrier: FAIRE_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? "OTHER", tracking_code: primaryLabel.trackingNumber }] });
                }
            } catch (e) { console.error("Failed to update Faire shipment:", e.message); }
        }
        if (order.marketplace?.toLowerCase() === "walmart" && order.marketplaceOrderId) {
            try {
                const walmartConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId) ?? await ApiKeyIntegrations.findOne({ type: "walmart" });
                if (walmartConn) {
                    const WALMART_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                    const { order: wOrder } = await getOrderWalmart({ clientId: walmartConn.apiKey, clientSecret: walmartConn.apiSecret, purchaseOrderId: order.marketplaceOrderId });
                    if (wOrder) {
                        const lines = (wOrder.orderLines?.orderLine ?? []).map(l => ({ lineNumber: l.lineNumber, quantity: parseInt(l.orderLineQuantity?.amount ?? "1", 10), trackingNumber: primaryLabel.trackingNumber, carrier: WALMART_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? "USPS" }));
                        await shipOrderWalmart({ clientId: walmartConn.apiKey, clientSecret: walmartConn.apiSecret, purchaseOrderId: order.marketplaceOrderId, lines });
                    }
                }
            } catch (e) { console.error("Failed to update Walmart shipment:", e.message); }
        }
        if (order.marketplace?.toLowerCase() === "channelengine" && order.marketplaceOrderId) {
            try {
                const CE_CARRIER = { usps: "PostNL", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                const lines = (order.items ?? []).map((item, idx) => ({ MerchantProductNo: item.sku || item.pieceId || String(idx + 1), Quantity: 1, ShipmentLineNo: String(idx + 1) }));
                await ceCreateShipment({ MerchantOrderNo: `CE-${order.marketplaceOrderId}`, Lines: lines, TrackTraceNo: primaryLabel.trackingNumber, Method: CE_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? data.selectedShipping.provider ?? "Other", ShippedAt: new Date().toISOString() });
            } catch (e) { console.error("Failed to update ChannelEngine shipment:", e.message); }
        }
        if (order.marketplace?.toLowerCase() === "ebay" && order.marketplaceOrderId) {
            try {
                const ebayConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId) ?? await ApiKeyIntegrations.findOne({ type: "ebay" });
                if (ebayConn) {
                    await shipOrderEbay(ebayConn, order.marketplaceOrderId, {
                        trackingNumber: primaryLabel.trackingNumber,
                        carrier: data.selectedShipping.provider,
                        lineItemIds: order.ebayLineItemIds ?? [],
                    });
                }
            } catch (e) { console.error("Failed to update eBay shipment:", e.message); }
        }
        // Directly-pulled TikTok order — push the package/tracking back via the TikTok API.
        if (["tik tok", "tiktok"].includes(order.marketplace?.toLowerCase()) && (order.uniquePo || "").endsWith("tik_tok")) {
            const res = await shipOrderTikTok({ order, items: order.items ?? [], trackingNumber: primaryLabel.trackingNumber, provider: data.selectedShipping.provider }).catch(e => ({ error: true, msg: e.message }));
            if (res?.error) console.error("Failed to update TikTok shipment:", res.msg);
        }
        if (order.marketplace?.toLowerCase() === "acenda" && order.marketplaceOrderId && order.marketplaceConnectionId) {
            try {
                const acendaConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId);
                if (acendaConn) {
                    const ACENDA_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                    await fulfillShipAdviceAcenda({
                        clientId: acendaConn.apiKey,
                        clientSecret: acendaConn.apiSecret,
                        organization: acendaConn.organization,
                        id: order.marketplaceOrderId,
                        carrier: ACENDA_CARRIER[data.selectedShipping.provider?.toLowerCase()] ?? data.selectedShipping.provider ?? "USPS",
                        trackingNumber: primaryLabel.trackingNumber,
                    });
                }
            } catch (e) { console.error("Failed to update Acenda shipment:", e.message); }
        }
        // Commerce Cloud order — report shipment + actual label cost back to the platform
        if (order.marketplace === "Commerce Cloud") {
            await postProviderStatus({
                providerOrderId: order._id.toString(),
                status:          "shipped",
                trackingNumber:  primaryLabel.trackingNumber,
                carrier:         data.selectedShipping.provider,
                shippingCost:    Math.round(totalCost * 100), // dollars → cents
            });
        }
        // clear bin and print all labels
        await Bin.findOneAndUpdate({order: order._id}, {"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null});
        const printHeaders = { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sc.localKey}` } };
        for (const lbl of purchasedLabels) {
            try { await axios.post(`http://${sc.localIP}/api/shipping/${printEndpoint}`, { label: lbl.label, station: data.station, barcode: "ppp" }, printHeaders); } catch(e) { console.error("Print failed:", e.message); }
        }
        return NextResponse.json({
            error: false,
            label: primaryLabel.label,
            bins: {
                readyToShip: await Bin.find({ ready: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
                inUse: await Bin.find({ inUse: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
            },
        });
    }catch(e){
        logError({ error: e, app: "premier", provider: "premierPrinting", source: "api/production/shipping/labels", context: { orderId: data?.orderId, marketplace: data?.marketplace, station: data?.station, provider: data?.selectedShipping?.provider } });
        console.log(e)
        return NextResponse.json({error: true, msg:JSON.stringify(e)})
    }
}

export async function PUT(req= NextApiRequest){
    let data = await req.json();
    let res = await getRefund({providers: ["usps", "fedex"], PIC: data.PIC,  enSettings: {
        requesterID: process.env.endiciaRequesterID,
        accountNumber: process.env.endiciaAccountNUmber,
        passPhrase: process.env.endiciaPassPhrase,
        },
        credentials: {
            clientId: process.env.uspsClientId,
            clientSecret: process.env.uspsClientSecret,
            crid: process.env.uspsCRID,
            mid: process.env.uspsMID,
            manifestMID: process.env.manifestMID,
            accountNumber: process.env.accountNumber
        },
        credentialsFedEx: {
        accountNumber: process.env.tpalfedexaccountnumber,
        meterNumber: process.env.tpalfedexmeternumber,
        key: process.env.tpalfedexkey,
        password: process.env.tpalfedexpassword,
        },
        credentialsFedExNew: {
        accountNumber: process.env.AccountFedExTest,
        key: process.env.ApiKeyTestFedEx,
        secret: process.env.SecretKeyFedExTest,
        },
        credentialsUPS: {
        accountNumber: process.env.UPSAccountNumber,
        clientID: process.env.UPSClientID,
        clientSecret: process.env.UPSClientSecret,
        },})
    return NextResponse.json(res)
}