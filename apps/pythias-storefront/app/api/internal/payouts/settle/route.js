export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { assertInternal } from "@/lib/internal";
import { settleOrderPayout } from "@/lib/payouts";

// POST /api/internal/payouts/settle  (server-to-server, from the platform provider-callback)
// Body: { orderId }  →  { status, transferId?, amount? }
// Fires the seller's Stripe Connect payout for a shipped order. Idempotent — a second call
// on an already-paid order is a no-op (settleOrderPayout checks order.storefrontPayout.status).
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    try {
        const result = await settleOrderPayout(orderId);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
