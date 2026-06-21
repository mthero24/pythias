import { NextResponse } from "next/server";
import { Order } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { userFromToken, logActivity } from "@pythias/backend/server";

const PLATFORM_BASE = () => process.env.PLATFORM_INTERNAL_BASE || "http://127.0.0.1:3010";

// POST /api/orders/refund — premier (the fulfiller, on its own DB) refunds a Commerce Cloud order.
// The payment lives in the seller's order on the platform, so we route the refund there BY poNumber
// (premier's order copy carries the seller's poNumber). Body: { orderId, amountCents?, reason? }
export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);
    const { orderId, amountCents, reason } = await req.json().catch(() => ({}));
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await Order.findById(orderId).select("poNumber").lean();
    if (!order?.poNumber) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const key = process.env.PYTHIAS_INTERNAL_KEY;
    if (!key) return NextResponse.json({ error: "Refunds are not configured" }, { status: 503 });

    try {
        const res = await fetch(`${PLATFORM_BASE()}/api/internal/refund-by-po`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pythias-internal-key": key },
            body: JSON.stringify({ poNumber: order.poNumber, amountCents, reason: reason || "customer_service", by: email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data.error || "Refund failed" }, { status: res.status });
        logActivity({ action: "order_refunded", entity: "order", entityId: orderId, entityName: order.poNumber, userName, email });
        return NextResponse.json({ success: true, ...data });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Refund failed" }, { status: 500 });
    }
}
