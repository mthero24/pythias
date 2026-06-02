import { NextApiRequest, NextResponse } from "next/server";
import {buyLabel} from "@pythias/shipping";
import {getRefund} from "@pythias/shipping"
import { Order, Manifest as manifest } from "@pythias/mongo";
import axios from "axios"
import { Bin } from "@pythias/mongo";
import {updateOrder, createReceiptShipment, shipOrderFaire, shipOrderWalmart, getOrderWalmart} from "@pythias/integrations";
import { createShipment as ceCreateShipment } from "@/functions/channelEngine";
import {ApiKeyIntegrations, Item as Items} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";
export async function POST(req= NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    console.log(data)
    if(!data.address.country) data.address.country = "US"
    const sc = await getShippingCreds();
    const stationCfg = sc.stations.find(s => s.name === data.station);
    const stationFormat = stationCfg?.format ?? "PDF";
    const printEndpoint = stationFormat === "ZPL" ? "printers" : "cpu";
    const buyOpts = {
        ...data,
        imageType: stationFormat,
        businessAddress: data.marketplace == "TCS" ? { name: "TSC Distribution Center", businessName: "ATTN: Online Orders", address: "100 Rains Drive", city: "Fanklin", state: "KY", postalCode: "42134", country: "US" } : sc.businessAddress,
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
        const itemIds = order.items.map(i => i._id);
        await Items.updateMany(
            { _id: { $in: itemIds } },
            { $set: { shipped: true, shippedDate: new Date() }, $push: { steps: { status: "Shipped", date: new Date() } } }
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