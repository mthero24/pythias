import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { userFromToken, logActivity, storefront } from "@pythias/backend/server";

// POST /api/orders/refund — refund a storefront order's payment (full, or partial for customer
// service). Cancellation is separate (/api/orders/cancel). Seller-scoped: refundStorefrontOrder
// verifies the order belongs to this org. Body: { orderId, amountCents?, reason? }
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userName, email, orgId } = userFromToken(token);
    const { orderId, amountCents, reason } = await req.json().catch(() => ({}));
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    try {
        const r = await storefront.refundStorefrontOrder(token.orgId, { orderId, amountCents, reason, by: email });
        logActivity({ action: "order_refunded", entity: "order", entityId: orderId, entityName: "", userName, email, orgId });
        return NextResponse.json({ success: true, ...r });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Refund failed" }, { status: e.status || 500 });
    }
}
