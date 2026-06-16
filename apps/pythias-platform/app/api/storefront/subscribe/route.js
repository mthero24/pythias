import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/stripe";
import { STOREFRONT_PLANS } from "@/lib/storefrontPlans";

// POST /api/storefront/subscribe { plan } — start a Stripe subscription Checkout for the storefront
// add-on. On payment, the billing webhook sets StorefrontSite.plan, which unlocks the menu.
export async function POST(req) {
    const stripe = getStripe();
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan } = await req.json().catch(() => ({}));
    const cfg = STOREFRONT_PLANS[plan];
    if (!cfg) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const org = await Organization.findById(token.orgId).lean();
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const baseUrl = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
    const priceId = process.env[cfg.priceEnv];
    const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : { quantity: 1, price_data: { currency: "usd", recurring: { interval: "month" }, product_data: { name: `Pythias Storefront — ${cfg.name}` }, unit_amount: cfg.monthlyCents } };

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [lineItem],
        ...(org.stripeCustomerId ? { customer: org.stripeCustomerId } : { customer_creation: "always" }),
        metadata: { orgId: String(token.orgId), kind: "storefront_subscription", plan },
        subscription_data: { metadata: { orgId: String(token.orgId), kind: "storefront_subscription", plan } },
        success_url: `${baseUrl}/${org.slug}/storefront?subscribed=1`,
        cancel_url: `${baseUrl}/${org.slug}/storefront/welcome`,
    });
    return NextResponse.json({ url: session.url });
}
