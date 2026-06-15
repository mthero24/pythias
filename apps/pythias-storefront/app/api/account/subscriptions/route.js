export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSubscription } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

const shape = (s) => ({
    id: String(s._id), status: s.status, intervalLabel: s.intervalLabel, intervalDays: s.intervalDays,
    discountPercent: s.discountPercent, nextBillingAt: s.nextBillingAt, cyclesBilled: s.cyclesBilled,
    items: (s.items || []).map((i) => ({ sku: i.sku, qty: i.qty })),
});

// GET /api/account/subscriptions — the signed-in buyer's subscriptions.
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const subs = await StorefrontSubscription.find({ orgId: auth.orgId, customerId: auth.customer._id }).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ error: false, subscriptions: subs.map(shape) });
}
