import { NextResponse } from "next/server";
import { Order, Items, ApiKeyIntegrations } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
import { updateOrder, shipOrderEbay, shipOrderWalmart, createReceiptShipment, shipOrderFaire, fulfillShipAdviceAcenda } from "@pythias/integrations";
import { shipOrderTikTok } from "@/functions/tikTok";

// A directly-pulled TikTok order has no marketplaceConnectionId/ShipStation id — it's created by
// pullTikTokOrders with marketplace "tik tok" and uniquePo ending in "tik_tok" (poNumber === the
// TikTok order id). Those need the tracking pushed back via the TikTok API, not ShipStation.
function isDirectTikTokOrder(order) {
    const mk = (order.marketplace || "").toLowerCase().replace(/[^a-z]/g, "");
    return mk === "tiktok" && (order.uniquePo || "").endsWith("tik_tok");
}

function toCarrierCode(provider) {
    if (!provider) return "usps";
    const p = provider.toLowerCase();
    if (p.includes("ups"))   return "ups";
    if (p.includes("fedex")) return "fedex";
    if (p.includes("dhl"))   return "dhl";
    return "usps";
}

export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();

    let order = await Order.findById(data.order._id).populate("items");
    if (!order) return NextResponse.json({ error: true, msg: "Order not found" }, { status: 404 });

    // Resolve tracking — prefer newly entered, fall back to existing label
    const existingTracking = order.shippingInfo?.labels?.[0]?.trackingNumber ?? null;
    const existingProvider = order.shippingInfo?.labels?.[0]?.provider ?? null;
    const trackingNumber   = data.trackingNumber?.trim() || existingTracking || null;
    const provider         = data.provider?.trim()       || existingProvider || null;

    // Mark order shipped
    const beforeStatus = order.status;
    order.status = "shipped";
    if (!order.shippingInfo) order.shippingInfo = {};
    order.shippingInfo.shippedAt = new Date();

    // Add tracking label if it's new (not already stored)
    const alreadyStored = order.shippingInfo.labels?.some(l => l.trackingNumber === trackingNumber);
    if (trackingNumber && !alreadyStored) {
        if (!order.shippingInfo.labels) order.shippingInfo.labels = [];
        order.shippingInfo.labels.push({ trackingNumber, provider: provider ?? "usps" });
    }

    await order.save();

    // Mark all items shipped
    if (order.items?.length) {
        await Items.updateMany(
            { _id: { $in: order.items.map(i => i._id ?? i) } },
            { $set: { status: "shipped", shipped: true, labelPrinted: true } }
        );
    }

    logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName, email });
    logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || "", action: "order_shipped", before: { status: beforeStatus }, after: { status: "shipped", trackingNumber: trackingNumber ?? null }, userName, email, provider: "premierPrinting" });

    // ── Notify marketplace ────────────────────────────────────────────────────
    let marketplaceNotified = false;
    let warning = null;

    if (!trackingNumber) {
        warning = "No tracking number found — marketplace was not updated. Please update the marketplace manually.";
    } else if (isDirectTikTokOrder(order)) {
        // TikTok Shop order pulled directly via the TikTok API — push the package/tracking back.
        try {
            const res = await shipOrderTikTok({ order, items: order.items ?? [], trackingNumber, provider });
            if (res?.error) {
                warning = `TikTok shipment update failed: ${res.msg}. Please update TikTok manually.`;
            } else {
                marketplaceNotified = true;
            }
        } catch (e) {
            console.error("[orders/shipped] TikTok update error:", e);
            warning = `TikTok shipment update failed: ${e.message}`;
        }
    } else if (order.marketplaceConnectionId) {
        // Direct marketplace connection (Faire, Etsy, Walmart, eBay, Acenda…)
        try {
            const conn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId).lean();
            const type = conn?.type?.toLowerCase();

            if (type === "ebay") {
                await shipOrderEbay(conn, order.marketplaceOrderId, {
                    trackingNumber,
                    carrier: provider,
                    lineItemIds: order.ebayLineItemIds ?? [],
                });
                marketplaceNotified = true;
            } else if (type === "walmart") {
                // Extract Walmart line numbers from item orderItemIds (format: purchaseOrderId_lineNumber)
                const liveConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId);
                const items    = await Items.find({ _id: { $in: order.items } }).select("orderItemId").lean();
                const lines    = items
                    .map(i => ({ lineNumber: i.orderItemId?.split("_").slice(-1)[0] }))
                    .filter(l => l.lineNumber)
                    .map(l => ({ ...l, quantity: 1, trackingNumber, carrier: (provider || "USPS").toUpperCase() }));

                if (lines.length) {
                    await shipOrderWalmart({
                        clientId:        liveConn.apiKey,
                        clientSecret:    liveConn.apiSecret,
                        purchaseOrderId: order.marketplaceOrderId,
                        lines,
                    });
                    marketplaceNotified = true;
                } else {
                    warning = "Walmart line numbers could not be resolved — please update Walmart manually.";
                }
            } else if (type === "etsy") {
                // createReceiptShipment refreshes + saves the token, so it needs a live (non-lean) doc.
                const liveConn = await ApiKeyIntegrations.findById(order.marketplaceConnectionId);
                await createReceiptShipment(liveConn, order.marketplaceOrderId, trackingNumber, provider);
                marketplaceNotified = true;
            } else if (type === "faire") {
                const FAIRE_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FEDEX", dhl: "DHL_EXPRESS" };
                await shipOrderFaire({
                    apiKey: conn.apiKey,
                    orderId: order.marketplaceOrderId,
                    shipments: [{ carrier: FAIRE_CARRIER[provider?.toLowerCase()] ?? "OTHER", tracking_code: trackingNumber }],
                });
                marketplaceNotified = true;
            } else if (type === "acenda") {
                const ACENDA_CARRIER = { usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL" };
                await fulfillShipAdviceAcenda({
                    clientId: conn.apiKey,
                    clientSecret: conn.apiSecret,
                    organization: conn.organization,
                    id: order.marketplaceOrderId,
                    carrier: ACENDA_CARRIER[provider?.toLowerCase()] ?? provider ?? "USPS",
                    trackingNumber,
                });
                marketplaceNotified = true;
            } else {
                warning = `${type ? type.charAt(0).toUpperCase() + type.slice(1) : "Marketplace"} does not support automatic shipment updates — please update manually.`;
            }
        } catch (e) {
            console.error("[orders/shipped] marketplace update error:", e);
            warning = `Marketplace update failed: ${e.message}`;
        }
    } else {
        // ShipStation order
        try {
            const ssAuth = `${process.env.ssApiKey}:${process.env.ssApiSecret}`;
            await updateOrder({ auth: ssAuth, orderId: order.orderId, carrierCode: toCarrierCode(provider), trackingNumber });
            marketplaceNotified = true;
        } catch (e) {
            console.error("[orders/shipped] ShipStation update error:", e);
            warning = `ShipStation update failed: ${e.message}`;
        }
    }

    return NextResponse.json({ error: false, order, marketplaceNotified, warning: warning ?? null });
}
