export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSite, StorefrontCustomer, StorefrontCheckoutSession, StorefrontSubscription } from "@pythias/mongo";
import { placeOrder } from "@/lib/checkout";
import { routeOrderViaPlatform } from "@/lib/routing";
import { enqueueSubscriptionStarted } from "@/lib/emailFlows";
import { storefrontStripe, STOREFRONT_WEBHOOK_SECRET } from "@/lib/stripe";

// POST /api/checkout/webhook — Stripe → us. On payment success, turn the pending checkout
// session into a real order (idempotent via paymentRef). This is what GATES order creation
// on confirmed payment. NOTE: this route must be excluded from any auth middleware.
export async function POST(req) {
    const stripe = storefrontStripe();
    if (!stripe || !STOREFRONT_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

    const raw = await req.text();
    const sig = req.headers.get("stripe-signature");
    let event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, STOREFRONT_WEBHOOK_SECRET);
    } catch (e) {
        return NextResponse.json({ error: `Signature verification failed: ${e.message}` }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const session = await StorefrontCheckoutSession.findOne({ _id: pi.metadata?.sessionId, orgId: pi.metadata?.orgId });
        if (session && session.status !== "completed") {
            const site = await StorefrontSite.findOne({ orgId: session.orgId }).lean();
            const customer = session.customerId ? await StorefrontCustomer.findById(session.customerId).lean() : null;

            // Capture the actual Stripe processing fee now — it's needed for the seller
            // payout later and can't be recovered after the fact.
            let stripeFeeCents = 0;
            try {
                if (pi.latest_charge) {
                    const charge = await stripe.charges.retrieve(pi.latest_charge, { expand: ["balance_transaction"] });
                    stripeFeeCents = charge?.balance_transaction?.fee || 0;
                }
            } catch (e) { console.warn("[storefront webhook] fee capture failed:", e.message); }

            try {
                const result = await placeOrder({
                    orgId: session.orgId, site, customer,
                    items: session.items, shippingAddress: session.shippingAddress,
                    email: session.email, redeemCents: session.redeemCents, promoCode: session.promoCode, giftCardCode: session.giftCardCode,
                    taxCents: session.taxCents || 0,
                    stripeFeeCents,
                    paymentRef: pi.id,   // idempotency key
                });
                // Record the Stripe Tax transaction for filing (best-effort).
                if (session.taxCalcId) {
                    try { await stripe.tax.transactions.createFromCalculation({ calculation: session.taxCalcId, reference: result.poNumber || String(result.orderId) }); }
                    catch (e) { console.warn("[storefront webhook] tax transaction record failed:", e.message); }
                }
                session.status = "completed";
                session.orderId = result.orderId;
                await session.save();

                // Subscribe & save: save the card off-session + create the recurring subscription.
                if (!result.duplicate && session.subscribe?.intervalDays && session.customerId && pi.payment_method) {
                    try {
                        await stripe.paymentMethods.attach(pi.payment_method, { customer: pi.customer }).catch(() => {});
                        await stripe.customers.update(pi.customer, { invoice_settings: { default_payment_method: pi.payment_method } }).catch(() => {});
                        await StorefrontSubscription.create({
                            orgId: session.orgId, customerId: session.customerId, customerEmail: session.email,
                            items: session.items, shippingAddress: session.shippingAddress,
                            intervalDays: session.subscribe.intervalDays, intervalLabel: session.subscribe.intervalLabel, discountPercent: session.subscribe.discountPercent || 0,
                            stripeCustomerId: pi.customer, stripePaymentMethodId: pi.payment_method,
                            status: "active", nextBillingAt: new Date(Date.now() + session.subscribe.intervalDays * 864e5),
                            lastOrderId: result.orderId, cyclesBilled: 1,
                        });
                        await enqueueSubscriptionStarted(site, { orgId: session.orgId, email: session.email, customerId: session.customerId, intervalLabel: session.subscribe.intervalLabel, nextBillingAt: new Date(Date.now() + session.subscribe.intervalDays * 864e5) }).catch(() => {});
                    } catch (e) { console.error("[storefront webhook] subscription create failed:", e.message); }
                }

                // Hand the order to the platform routing engine → fulfillment provider.
                // Best-effort: payment is captured and the order exists; if routing fails the
                // platform alerts the seller (RoutingLog/notification) and it can be re-routed.
                if (!result.duplicate) {
                    const routed = await routeOrderViaPlatform(result.orderId);
                    if (!routed.ok) console.error("[storefront webhook] routing failed:", routed.error);
                    else if (routed.unroutable) console.warn("[storefront webhook] order unroutable:", routed.reason);
                }
            } catch (e) {
                // Leave the session pending; payment succeeded but placement failed — alert/retry.
                console.error("[storefront webhook] placeOrder failed:", e.message);
                return NextResponse.json({ error: "Order placement failed" }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
