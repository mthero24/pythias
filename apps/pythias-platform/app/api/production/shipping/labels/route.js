import { NextResponse } from "next/server";
import { PlatformBin, PlatformOrder, PlatformItem, Manifest, ApiKeyIntegrations } from "@pythias/mongo";
import { buyLabel, getRefund } from "@pythias/shipping";
import { updateOrder, createReceiptShipment, shipOrderFaire, shipOrderWalmart, getOrderWalmart, shipOrderEbay, fulfillShipAdviceAcenda } from "@pythias/integrations";
import { getToken } from "next-auth/jwt";
import { getOrgCreds, buildShippingCreds } from "@/lib/getOrgCreds";
import { createCEClient } from "@/functions/channelEngine";
import { shipOrderTikTok } from "@/functions/tikTok";
import { logError } from "@pythias/backend/server";
import axios from "axios";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const data = await req.json();
    if (!data.address?.country) data.address.country = "US";

    // Training-mode gate (server-side, can't be bypassed): a trainee must have scanned every item in
    // the order before a shipping label will print. Set via the user's `permissions.shipTraining`.
    if (token?.permissions?.shipTraining) {
        const tItems = await PlatformItem.find({ orgId, order: data.orderId, cancelled: { $ne: true } }).select("pieceId").lean();
        const required = tItems.map(i => String(i.pieceId || "").toUpperCase()).filter(Boolean);
        const scannedSet = new Set((data.scannedPieceIds || []).map(p => String(p || "").toUpperCase()));
        const missing = required.filter(p => !scannedSet.has(p));
        if (!required.length || missing.length) {
            return NextResponse.json({ error: true, msg: `Training mode: scan all ${required.length} item(s) before shipping — ${missing.length} not scanned.` });
        }
    }

    const creds = await getOrgCreds(orgId);
    const sc = buildShippingCreds(creds);

    const buyOpts = {
        ...data,
        imageType: "PDF",
        imageFormat: "PDF",
        businessAddress: sc.businessAddress,
        providers: ["usps", "ups"],
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsUPS: sc.credentialsUPS,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsShipStation: { apiKey: sc.ssV2 },
    };

    try {
        const pkgs = data.packages?.length > 1 ? data.packages : [{ weight: data.weight, dimensions: data.dimensions }];
        const purchasedLabels = [];
        for (const pkg of pkgs) {
            const lbl = await buyLabel({ ...buyOpts, weight: pkg.weight, dimensions: pkg.dimensions });
            if (lbl.error) return NextResponse.json(lbl);
            purchasedLabels.push(lbl);
        }
        const label = purchasedLabels[0];
        const totalCost = purchasedLabels.reduce((s, l) => s + parseFloat(l.cost ?? 0), 0);

        if (data.selectedShipping?.provider === "usps") {
            for (const lbl of purchasedLabels) {
                await Manifest.create({ pic: lbl.trackingNumber, Date: new Date() }).catch(() => {});
            }
        }

        const order = await PlatformOrder.findOne({ orgId, _id: data.orderId }).populate("items");
        if (!order) return NextResponse.json({ error: true, msg: "Order not found" });

        order.shippingInfo = order.shippingInfo ?? {};
        order.shippingInfo.label = label.label;
        order.shippingInfo.shippingCost = (order.shippingInfo.shippingCost ?? 0) + totalCost;
        order.shippingInfo.shippedAt = new Date();
        order.shippingInfo.labels = order.shippingInfo.labels ?? [];
        for (const lbl of purchasedLabels) {
            order.shippingInfo.labels.push({
                trackingNumber: lbl.trackingNumber,
                label: lbl.label,
                cost: parseFloat(lbl.cost ?? 0),
                trackingInfo: ["Label Purchased"],
                provider: data.selectedShipping?.provider,
            });
        }
        order.status = "Shipped";

        // Mark EVERY item belonging to this order (by order ref, not the populated order.items array
        // which can be stale/incomplete — a missed piece leaves it shipped:false and the order looking
        // unshipped). Keep the `shipped` boolean + `status` in sync; reports key off the boolean.
        await PlatformItem.updateMany(
            { orgId, order: order._id, cancelled: { $ne: true } },
            { $set: { shipped: true, shippedDate: new Date(), status: "Shipped" }, $push: { steps: { status: "Shipped", date: new Date() } } },
        );
        await order.save();

        // Marketplace tracking updates
        const marketplace = order.marketplace?.toLowerCase();
        if (marketplace === "etsy" && order.marketplaceOrderId && creds.etsy?.accessToken) {
            await createReceiptShipment(
                { type: "etsy", ...creds.etsy },
                order.marketplaceOrderId,
                label.trackingNumber,
                data.selectedShipping?.provider,
            ).catch(e => console.error("Etsy shipment:", e.message));
        }
        if (marketplace === "faire" && order.marketplaceOrderId && creds.faire?.secretId) {
            const FAIRE_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FEDEX", dhl: "DHL_EXPRESS" };
            const carrier = FAIRE_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? "OTHER";
            await shipOrderFaire({
                apiKey: creds.faire.secretId,
                orderId: order.marketplaceOrderId,
                shipments: [{ carrier, tracking_code: label.trackingNumber }],
            }).catch(e => console.error("Faire shipment:", e.message));
        }
        if (marketplace === "walmart" && order.marketplaceOrderId && creds.walmart?.clientId) {
            const WALMART_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
            const carrier = WALMART_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? "USPS";
            try {
                const { order: wOrder } = await getOrderWalmart({
                    clientId: creds.walmart.clientId,
                    clientSecret: creds.walmart.clientSecret,
                    purchaseOrderId: order.marketplaceOrderId,
                });
                if (wOrder) {
                    const lines = (wOrder.orderLines?.orderLine ?? []).map(l => ({
                        lineNumber: l.lineNumber,
                        quantity: parseInt(l.orderLineQuantity?.amount ?? "1", 10),
                        trackingNumber: label.trackingNumber,
                        carrier,
                    }));
                    await shipOrderWalmart({
                        clientId: creds.walmart.clientId,
                        clientSecret: creds.walmart.clientSecret,
                        purchaseOrderId: order.marketplaceOrderId,
                        lines,
                    });
                }
            } catch (e) { console.error("Walmart shipment:", e.message); }
        }
        if (marketplace === "channelengine" && order.marketplaceOrderId && creds.channelengine?.apiUrl) {
            const CE_CARRIER = { usps: "PostNL", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
            const ceCarrier = CE_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? data.selectedShipping?.provider ?? "Other";
            const ceClient = createCEClient(creds.channelengine.apiUrl, creds.channelengine.apiKey);
            const lines = (order.items ?? []).map((item, idx) => ({
                MerchantProductNo: item.sku || item.pieceId || String(idx + 1),
                Quantity: 1,
                ShipmentLineNo: String(idx + 1),
            }));
            await ceClient.createShipment({
                MerchantOrderNo: `CE-${order.marketplaceOrderId}`,
                Lines: lines,
                TrackTraceNo: label.trackingNumber,
                Method: ceCarrier,
                ShippedAt: new Date().toISOString(),
            }).catch(e => console.error("ChannelEngine shipment:", e.message));
        }
        if (marketplace === "shipstation" && creds.shipstation?.apiKey) {
            await updateOrder({
                auth: `${creds.shipstation.apiKey}:${creds.shipstation.apiSecret}`,
                orderId: order.orderId,
                carrierCode: "usps",
                trackingNumber: label.trackingNumber,
            }).catch(e => console.error("ShipStation update:", e.message));
        }
        if (marketplace === "ebay" && order.marketplaceOrderId && order.marketplaceConnectionId) {
            // eBay connection lives in ApiKeyIntegrations (the source the order was pulled from).
            try {
                const ebayConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId);
                if (ebayConn) {
                    await shipOrderEbay(ebayConn, order.marketplaceOrderId, {
                        trackingNumber: label.trackingNumber,
                        carrier: data.selectedShipping?.provider,
                        lineItemIds: order.ebayLineItemIds ?? [],
                    });
                }
            } catch (e) { console.error("eBay shipment:", e.message); }
        }
        // Directly-pulled TikTok orders (marketplace "tik tok", uniquePo ending in "tik_tok") have
        // no ShipStation/marketplaceConnection — push the package/tracking back via the TikTok API.
        if ((marketplace === "tik tok" || marketplace === "tiktok") && (order.uniquePo || "").endsWith("tik_tok")) {
            const res = await shipOrderTikTok({
                order,
                items: order.items ?? [],
                trackingNumber: label.trackingNumber,
                provider: data.selectedShipping?.provider,
            }).catch(e => ({ error: true, msg: e.message }));
            if (res?.error) console.error("TikTok shipment:", res.msg);
        }
        if (marketplace === "acenda" && order.marketplaceOrderId && order.marketplaceConnectionId) {
            try {
                const acendaConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId);
                if (acendaConn) {
                    const ACENDA_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                    await fulfillShipAdviceAcenda({
                        clientId: acendaConn.apiKey,
                        clientSecret: acendaConn.apiSecret,
                        organization: acendaConn.organization,
                        id: order.marketplaceOrderId,
                        carrier: ACENDA_CARRIER[data.selectedShipping?.provider?.toLowerCase()] ?? data.selectedShipping?.provider ?? "USPS",
                        trackingNumber: label.trackingNumber,
                    });
                }
            } catch (e) { console.error("Acenda shipment:", e.message); }
        }

        // Print all labels on local printer
        for (const lbl of purchasedLabels) {
            await axios.post(
                `http://${creds.localIP}/api/shipping/cpu`,
                { label: lbl.label, station: data.station, barcode: "ppp" },
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } },
            ).catch(e => console.error("Print request:", e.message));
        }

        // Return updated bin state
        const [readyToShip, inUse] = await Promise.all([
            PlatformBin.find({ orgId, status: "ready" })
                .sort({ number: 1 })
                .populate({ path: "order", populate: "items" })
                .lean(),
            PlatformBin.find({ orgId, status: "in_use" })
                .sort({ number: 1 })
                .populate({ path: "order", populate: "items" })
                .lean(),
        ]);

        return NextResponse.json({
            error: false,
            label: label.label,
            bins: { readyToShip: JSON.parse(JSON.stringify(readyToShip)), inUse: JSON.parse(JSON.stringify(inUse)) },
        });
    } catch (e) {
        logError({ error: e, app: "platform", provider: "platform", source: "api/production/shipping/labels POST", context: { orgId, orderId: data?.orderId, provider: data?.selectedShipping?.provider } });
        console.error(e);
        return NextResponse.json({ error: true, msg: e.message ?? JSON.stringify(e) });
    }
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const creds = await getOrgCreds(token.orgId);
    const sc = buildShippingCreds(creds);

    const res = await getRefund({
        providers: ["usps", "fedex"],
        PIC: data.PIC,
        enSettings: sc.enSettings,
        credentials: sc.credentials,
        credentialsFedEx: sc.credentialsFedEx,
        credentialsUPS: sc.credentialsUPS,
    });
    return NextResponse.json(res);
}
