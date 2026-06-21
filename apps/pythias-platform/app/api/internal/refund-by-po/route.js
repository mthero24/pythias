export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { storefront } from "@pythias/backend/server";
import { assertInternal } from "@/lib/internal";

// POST /api/internal/refund-by-po — refund a Commerce Cloud order by poNumber. Used by premier (the
// fulfiller, on its own DB) so it can refund a seller's storefront order without seeing the payment.
// Body: { poNumber, amountCents?, reason?, by? }
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { poNumber, amountCents, reason, by } = await req.json().catch(() => ({}));
    if (!poNumber) return NextResponse.json({ error: "poNumber is required" }, { status: 400 });
    const order = await PlatformOrder.findOne({ poNumber, source: "storefront" }).select("_id orgId").lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    try {
        const r = await storefront.refundStorefrontOrder(order.orgId, { orderId: order._id, amountCents, reason, by });
        return NextResponse.json({ ok: true, ...r });
    } catch (e) {
        return NextResponse.json({ error: e.message || "Refund failed" }, { status: e.status || 500 });
    }
}
