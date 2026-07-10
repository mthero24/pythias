import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/stripe";

// Customer self-service cancellation.
// - Paid (has a Stripe subscription): cancel at period end — they keep access until the current
//   period ends, and it won't renew. Reversible until it actually lapses. The billing webhook
//   flips org.status when Stripe reports the cancellation.
// - Trial / no subscription: nothing is being billed, so just close the account now.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org = await Organization.findById(token.orgId);
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (org.stripeSubscriptionId) {
        try {
            const stripe = getStripe();
            await stripe.subscriptions.update(org.stripeSubscriptionId, { cancel_at_period_end: true });
        } catch (e) {
            return NextResponse.json({ error: e.message || "Could not cancel with Stripe" }, { status: 502 });
        }
        return NextResponse.json({ ok: true, mode: "period_end" });
    }
    // No active paid subscription (trial / no card) → close the account.
    org.status = "cancelled";
    await org.save();
    return NextResponse.json({ ok: true, mode: "closed" });
}
