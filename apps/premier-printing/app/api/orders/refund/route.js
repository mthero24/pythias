import { NextResponse } from "next/server";
import { Order } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { userFromToken, logActivity, storefront } from "@pythias/backend/server";

// POST /api/orders/refund — premier (the fulfiller) refunds a storefront order's payment (full, or
// partial for customer service). Premier is single-company + trusted; a storefront order's orgId is
// the SELLER's, so we load the order and act on its own org. Body: { orderId, amountCents?, reason? }
export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);
    const { orderId, amountCents, reason } = await req.json().catch(() => ({}));
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    const order = await Order.findById(orderId).select("orgId source").lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    try {
        const r = await storefront.refundStorefrontOrder(order.orgId, { orderId, amountCents, reason, by: email });
        logActivity({ action: "order_refunded", entity: "order", entityId: orderId, entityName: "", userName, email });
        return NextResponse.json({ success: true, ...r });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Refund failed" }, { status: e.status || 500 });
    }
}
