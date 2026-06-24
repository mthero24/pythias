import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { Organization, UsageLedger, StorefrontSite, PaymentReceived } from "@pythias/mongo";
import { getLimits } from "@/lib/tiers";
import { getStripe } from "@/lib/stripe";
import { logError } from "@pythias/backend/server";

// Enable the white-label mobile-app add-on for a store and mint its appKey (the app's tenant key)
// if it doesn't have one yet. Idempotent — re-runs keep the existing key.
async function enableMobileApp(orgId, subscriptionId) {
    if (!orgId) return;
    const site = await StorefrontSite.findOne({ orgId }).select("appKey").lean();
    const set = { appEnabled: true, "appSubscription.status": "active", "appSubscription.startedAt": new Date() };
    if (subscriptionId) set["appSubscription.stripeSubscriptionId"] = subscriptionId;
    if (!site?.appKey) set.appKey = "app_" + crypto.randomBytes(20).toString("hex");
    await StorefrontSite.findOneAndUpdate({ orgId }, { $set: set, $setOnInsert: { orgId } }, { upsert: true });
}

export async function POST(req) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            // Wallet top-up via Stripe Checkout — credit the wallet and save the card.
            case "checkout.session.completed": {
                const s = event.data.object;
                // Storefront add-on subscription → unlock the storefront tools (set the plan).
                if (s.metadata?.kind === "storefront_subscription") {
                    const plan = s.metadata.plan;
                    if (s.metadata.orgId && plan) {
                        await StorefrontSite.findOneAndUpdate(
                            { orgId: s.metadata.orgId },
                            { $set: { plan, "subscription.stripeSubscriptionId": s.subscription || null, "subscription.status": "active", "subscription.startedAt": new Date() }, $setOnInsert: { orgId: s.metadata.orgId } },
                            { upsert: true }
                        );
                        if (s.customer) await Organization.findByIdAndUpdate(s.metadata.orgId, { $set: { stripeCustomerId: s.customer } });
                    }
                    break;
                }
                // White-label mobile-app add-on purchased → enable the app + mint its appKey.
                if (s.metadata?.kind === "storefront_mobile_app" && s.metadata?.orgId) {
                    await enableMobileApp(s.metadata.orgId, s.subscription || null);
                    if (s.customer) await Organization.findByIdAndUpdate(s.metadata.orgId, { $set: { stripeCustomerId: s.customer } });
                    break;
                }
                // One-off onboarding / setup fee paid → record as received money (platform revenue).
                if (s.metadata?.type === "onboarding" && s.payment_status === "paid" && s.metadata?.orgId) {
                    const amt = s.amount_total || 0;
                    if (amt > 0) {
                        await PaymentReceived.findOneAndUpdate(
                            { stripeSessionId: s.id },
                            { $setOnInsert: { orgId: s.metadata.orgId, amountCents: amt, currency: s.currency || "usd", type: "onboarding", stripeSessionId: s.id, description: "Onboarding / setup fee", paidAt: new Date() } },
                            { upsert: true }
                        );
                        if (s.customer) await Organization.findByIdAndUpdate(s.metadata.orgId, { $set: { stripeCustomerId: s.customer } });
                    }
                    break;
                }
                if (s.metadata?.kind !== "wallet_topup" || s.payment_status !== "paid") break;
                const amount = parseInt(s.metadata.amountCents, 10) || 0;
                const set = { "wallet.lastRechargedAt": new Date() };
                if (s.customer) set.stripeCustomerId = s.customer;
                if (s.payment_intent) {
                    try {
                        const pi = await stripe.paymentIntents.retrieve(s.payment_intent);
                        if (pi.payment_method) set["wallet.stripePaymentMethodId"] = pi.payment_method;
                    } catch (e) { logError({ error: e, app: "platform", provider: "platform", source: "api/billing/webhook POST checkout.session.completed PI-retrieve", context: { orgId: s.metadata?.orgId, sessionId: s.id } }); console.error("[billing/webhook] PI retrieve failed:", e.message); }
                }
                if (s.metadata.orgId && amount > 0) {
                    await Organization.findByIdAndUpdate(s.metadata.orgId, {
                        $inc: { "wallet.balance": amount },
                        $set: set,
                    });
                    // Money received (prepaid wallet) — tagged "wallet" so finance can exclude it from platform revenue.
                    await PaymentReceived.findOneAndUpdate(
                        { stripeSessionId: s.id },
                        { $setOnInsert: { orgId: s.metadata.orgId, amountCents: amount, currency: s.currency || "usd", type: "wallet", stripeSessionId: s.id, description: "Wallet top-up", paidAt: new Date() } },
                        { upsert: true }
                    );
                }
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const org = await Organization.findOne({ stripeCustomerId: sub.customer });
                if (!org) break;

                const tierMap = {
                    [process.env.STRIPE_STARTER_PRICE_ID]: 'starter',
                    [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
                    [process.env.STRIPE_BUSINESS_PRICE_ID]: 'business',
                    [process.env.STRIPE_SCALE_PRICE_ID]: 'scale',
                };
                const priceId = sub.items?.data?.[0]?.price?.id;
                const tier = tierMap[priceId] ?? org.tier;
                const limits = getLimits(tier);

                await Organization.findByIdAndUpdate(org._id, {
                    tier,
                    limits,
                    status: sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'suspended',
                    stripeSubscriptionId: sub.id,
                });
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object;
                // Storefront add-on subscription canceled → re-lock the storefront tools.
                if (sub.metadata?.kind === "storefront_subscription") {
                    await StorefrontSite.findOneAndUpdate(
                        { "subscription.stripeSubscriptionId": sub.id },
                        { $set: { plan: "none", "subscription.status": "canceled", "subscription.canceledAt": new Date() } }
                    );
                    break;
                }
                // Mobile-app add-on canceled → disable the app (keep appKey so it works again if they re-add).
                if (sub.metadata?.kind === "storefront_mobile_app") {
                    await StorefrontSite.findOneAndUpdate(
                        { "appSubscription.stripeSubscriptionId": sub.id },
                        { $set: { appEnabled: false, "appSubscription.status": "canceled", "appSubscription.canceledAt": new Date() } }
                    );
                    break;
                }
                const org = await Organization.findOne({ stripeCustomerId: sub.customer });
                if (org) {
                    await Organization.findByIdAndUpdate(org._id, { status: 'cancelled' });
                }
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object;
                const org = await Organization.findOne({ stripeCustomerId: invoice.customer });
                if (!org) break;

                const period = new Date(invoice.period_end * 1000).toISOString().slice(0, 7);
                await UsageLedger.findOneAndUpdate(
                    { orgId: org._id, period },
                    { invoiced: true, stripeInvoiceId: invoice.id },
                    { upsert: true }
                );

                // Record the TRUE money received (subscription base fee + any overage on this invoice).
                // Idempotent on stripeInvoiceId so webhook retries don't double-count.
                const paidAmount = invoice.amount_paid || 0;
                if (paidAmount > 0) {
                    const reason = invoice.billing_reason || "";
                    const recurring = (invoice.lines?.data || []).some((l) => l.price?.recurring);
                    const type = reason.includes("subscription") || recurring ? "subscription" : "overage";
                    await PaymentReceived.findOneAndUpdate(
                        { stripeInvoiceId: invoice.id },
                        { $setOnInsert: {
                            orgId: org._id,
                            amountCents: paidAmount,
                            currency: invoice.currency || "usd",
                            type,
                            period,
                            stripeInvoiceId: invoice.id,
                            description: invoice.lines?.data?.[0]?.description || reason || "Platform invoice",
                            paidAt: new Date(((invoice.status_transitions?.paid_at) || invoice.created) * 1000),
                        } },
                        { upsert: true }
                    );
                }
                // Reset monthly order counter after invoice
                await Organization.findByIdAndUpdate(org._id, {
                    'usage.ordersThisMonth': 0,
                    'usage.periodStart': new Date(),
                });
                break;
            }
        }
    } catch (err) {
        logError({ error: err, app: "platform", provider: "platform", source: "api/billing/webhook POST", context: { eventType: event?.type, eventId: event?.id } });
        console.error("[billing/webhook]", err);
        return NextResponse.json({ error: "Processing error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
