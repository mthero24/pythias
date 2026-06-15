export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSubscription, StorefrontSite, StorefrontCustomer } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { storefrontStripe } from "@/lib/stripe";
import { computeTax } from "@/lib/stripe";
import { quoteCart, placeOrder } from "@/lib/checkout";
import { routeOrderViaPlatform } from "@/lib/routing";
import { enqueueSubscriptionFailed } from "@/lib/emailFlows";

// POST /api/internal/subscriptions/bill — charge due subscriptions off-session and place a
// routed order for each cycle. Run a few times a day by PM2. Failures back off; 3 strikes pause.
const MAX_FAILS = 3;

export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const stripe = storefrontStripe();
    if (!stripe) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

    const due = await StorefrontSubscription.find({ status: "active", nextBillingAt: { $lte: new Date() } }).limit(100).lean();
    const sites = {};
    let billed = 0, failed = 0;

    for (const sub of due) {
        try {
            const orgId = sub.orgId;
            const site = sites[String(orgId)] || (sites[String(orgId)] = await StorefrontSite.findOne({ orgId }).lean());
            const customer = await StorefrontCustomer.findById(sub.customerId).lean();

            // Quote the cycle (subscribe discount; no rewards/gift on recurring) + tax.
            const q = await quoteCart({ orgId, site, customer: null, items: sub.items, subscribe: true });
            if (!q.lines.length) { await advance(sub, { skip: true }); continue; }
            const currency = (site?.rewards?.currency || "usd").toLowerCase();
            const { taxCents } = await computeTax(stripe, { currency, lines: q.lines, shippingCents: q.shippingCents, address: sub.shippingAddress });
            const amount = Math.max(0, q.subtotalCents + q.shippingCents + taxCents - (q.discountCents || 0));
            if (amount <= 0) { await advance(sub, {}); continue; }

            // Off-session charge on the saved card.
            const pi = await stripe.paymentIntents.create({
                amount, currency, customer: sub.stripeCustomerId, payment_method: sub.stripePaymentMethodId,
                off_session: true, confirm: true,
                metadata: { subscriptionId: String(sub._id), orgId: String(orgId) },
            });
            if (pi.status !== "succeeded") throw new Error(`PaymentIntent ${pi.status}`);

            let stripeFeeCents = 0;
            try { if (pi.latest_charge) { const ch = await stripe.charges.retrieve(pi.latest_charge, { expand: ["balance_transaction"] }); stripeFeeCents = ch?.balance_transaction?.fee || 0; } } catch { /* ignore */ }

            const result = await placeOrder({
                orgId, site, customer, items: sub.items, shippingAddress: sub.shippingAddress,
                email: sub.customerEmail || customer?.email, redeemCents: 0, subscribe: true,
                taxCents, stripeFeeCents, paymentRef: pi.id,
            });
            if (!result.duplicate) await routeOrderViaPlatform(result.orderId).catch(() => {});
            await advance(sub, { orderId: result.orderId });
            billed++;
        } catch (e) {
            failed++;
            const fails = (sub.failedAttempts || 0) + 1;
            await StorefrontSubscription.updateOne({ _id: sub._id }, {
                $set: { failedAttempts: fails, ...(fails >= MAX_FAILS ? { status: "paused" } : { nextBillingAt: new Date(Date.now() + 2 * 864e5) }) },
            });
            // Dunning email so the buyer can fix their card.
            try { const site = sites[String(sub.orgId)] || (sites[String(sub.orgId)] = await StorefrontSite.findOne({ orgId: sub.orgId }).lean()); if (site) await enqueueSubscriptionFailed(site, { orgId: sub.orgId, email: sub.customerEmail, customerId: sub.customerId, attempt: fails }); } catch { /* ignore */ }
        }
    }
    return NextResponse.json({ due: due.length, billed, failed });
}

async function advance(sub, { orderId, skip }) {
    const set = { nextBillingAt: new Date(Date.now() + sub.intervalDays * 864e5), failedAttempts: 0 };
    const inc = skip ? {} : { cyclesBilled: 1 };
    if (orderId) set.lastOrderId = orderId;
    await StorefrontSubscription.updateOne({ _id: sub._id }, { $set: set, ...(Object.keys(inc).length ? { $inc: inc } : {}) });
}
