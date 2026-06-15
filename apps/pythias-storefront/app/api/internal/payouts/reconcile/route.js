export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { settleOrderPayout } from "@/lib/payouts";

// POST /api/internal/payouts/reconcile  (server-to-server, run hourly by PM2)
// Settles any storefront order that shipped but whose Stripe payout is still pending — e.g.
// the storefront was briefly down when the provider-callback fired. settleOrderPayout is
// idempotent, so this is safe to run repeatedly. Returns a small summary.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    // Shipped storefront orders still awaiting their seller payout.
    const stuck = await PlatformOrder.find({
        source: "storefront",
        status: { $in: ["shipped", "delivered"] },
        "storefrontPayout.status": "pending",
    }).select("_id").limit(200).lean();

    let paid = 0, skipped = 0, errors = 0;
    for (const o of stuck) {
        try {
            const r = await settleOrderPayout(o._id);
            if (r.status === "paid") paid++;
            else skipped++;   // skipped / no_payout / already_paid / not_found
        } catch (e) {
            errors++;
            console.error(`[payout-reconcile] order ${o._id} failed:`, e.message);
        }
    }

    return NextResponse.json({ scanned: stuck.length, paid, skipped, errors });
}
