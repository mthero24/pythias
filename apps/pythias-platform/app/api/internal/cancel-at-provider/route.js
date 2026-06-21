export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { cancelRoutedOrder } from "@/functions/sendToProvider";
import { assertInternal } from "@/lib/internal";

// POST /api/internal/cancel-at-provider — propagate a cancellation to the fulfiller that a Commerce
// Cloud order was routed to (stops production). Used by the storefront when a return is accepted.
// Body: { orderId? , poNumber? }
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { orderId, poNumber } = await req.json().catch(() => ({}));
    let oid = orderId, po = poNumber;
    if (!oid && po) {
        const o = await PlatformOrder.findOne({ poNumber: po, source: "storefront" }).select("_id poNumber").lean();
        if (o) { oid = o._id; po = o.poNumber; }
    }
    if (!oid) return NextResponse.json({ error: "orderId or poNumber required" }, { status: 400 });
    try {
        const r = await cancelRoutedOrder(oid, { poNumber: po, reason: "return_accepted" });
        return NextResponse.json({ ok: true, ...r });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
