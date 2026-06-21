import { Items, Order, ApiKeyIntegrations } from "@pythias/mongo";
import { cancelOrder as cancelShipStation, cancelOrderFaire, cancelOrderMirakl } from "@pythias/integrations";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange, storefront } from "@pythias/backend/server";

async function cancelMarketplace(order) {
    if (!order.marketplaceConnectionId) return null;

    const connection = await ApiKeyIntegrations.findById(order.marketplaceConnectionId).lean();
    if (!connection) return { error: "Connection not found" };

    const type = connection.type?.toLowerCase();

    if (type === "faire") {
        return cancelOrderFaire({
            apiKey: connection.apiKey,
            orderId: order.marketplaceOrderId,
            reason: "OTHER",
            note: "Cancelled by fulfiller",
        });
    }

    if (type === "mirakl") {
        return cancelOrderMirakl({
            apiKey: connection.apiKey,
            baseUrl: connection.organization,
            orderId: order.marketplaceOrderId,
        });
    }

    // Other marketplace types: no cancel API — return null to skip silently
    return null;
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);

    const { id, refund, refundAmountCents } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.canceled || order.status === "cancelled") {
        return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
    }

    const isManual = order.orderId?.startsWith("MANUAL-");

    // Try marketplace API cancel
    let marketplaceResult = null;
    if (!isManual && order.marketplaceConnectionId) {
        marketplaceResult = await cancelMarketplace(order);
    }

    // Try ShipStation cancel for non-manual, non-marketplace-API orders
    if (!isManual && !order.marketplaceConnectionId) {
        await cancelShipStation({
            auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`,
            orderId: order.orderId,
        });
    }

    // Cancel in DB
    await Order.findByIdAndUpdate(id, { status: "cancelled", canceled: true });
    await Items.updateMany({ order: order._id }, { status: "cancelled", canceled: true });

    logActivity({ action: "order_cancelled", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName, email });
    logChange({
        entityType: "order", entityId: order._id, entityName: order.poNumber || "",
        action: "order_cancelled",
        before: { status: order.status },
        after: { status: "cancelled" },
        userName, email, provider: "premierPrinting",
    });

    // Refund the buyer too, if requested (storefront orders only). Premier is the fulfiller, so the
    // order's own (seller) org owns the payment; refundStorefrontOrder moves the money in the storefront app.
    let refundResult = null;
    if (refund && order.source === "storefront") {
        try { refundResult = await storefront.refundStorefrontOrder(order.orgId, { orderId: id, amountCents: refundAmountCents, reason: "cancellation", by: email }); }
        catch (e) { refundResult = { error: e.message }; }
    }

    return NextResponse.json({
        success: true,
        marketplaceUpdated: !!marketplaceResult?.success,
        refund: refundResult,
    });
}
