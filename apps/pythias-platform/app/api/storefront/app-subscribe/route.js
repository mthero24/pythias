import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/stripe";

// POST /api/storefront/app-subscribe — start a Stripe subscription Checkout for the white-label
// mobile-app add-on. On payment, the billing webhook (kind: storefront_mobile_app) mints the store's
// appKey and sets appEnabled. Set STOREFRONT_MOBILE_APP_PRICE_ID to your Stripe price; the inline
// fallback ($199/mo) is a placeholder until that env is configured.
export async function POST(req) {
    const stripe = getStripe();
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(token.orgId).lean();
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const baseUrl = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
    const priceId = process.env.STOREFRONT_MOBILE_APP_PRICE_ID;
    const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : { quantity: 1, price_data: { currency: "usd", recurring: { interval: "month" }, product_data: { name: "Pythias Storefront — White-label Mobile App" }, unit_amount: 19900 } };

    const meta = { orgId: String(token.orgId), kind: "storefront_mobile_app" };
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [lineItem],
        ...(org.stripeCustomerId ? { customer: org.stripeCustomerId } : { customer_creation: "always" }),
        metadata: meta,
        subscription_data: { metadata: meta },
        success_url: `${baseUrl}/${org.slug}/storefront?app_enabled=1`,
        cancel_url: `${baseUrl}/${org.slug}/storefront`,
    });
    return NextResponse.json({ url: session.url });
}
