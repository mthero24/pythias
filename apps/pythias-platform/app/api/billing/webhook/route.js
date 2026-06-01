import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Organization, UsageLedger } from "@pythias/mongo";
import { getLimits } from "@/lib/tiers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
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
                // Reset monthly order counter after invoice
                await Organization.findByIdAndUpdate(org._id, {
                    'usage.ordersThisMonth': 0,
                    'usage.periodStart': new Date(),
                });
                break;
            }
        }
    } catch (err) {
        console.error("[billing/webhook]", err);
        return NextResponse.json({ error: "Processing error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
