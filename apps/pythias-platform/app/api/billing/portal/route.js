import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/stripe";
import { foundingDiscounts } from "@/lib/foundingCoupon";

export async function POST(req) {
    const stripe = getStripe();
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(token.orgId).lean();
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const baseUrl = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
    const returnUrl = `${baseUrl}/${org.slug}/billing`;

    // Existing Stripe customer → open billing portal (handles upgrades/downgrades natively)
    if (org.stripeCustomerId) {
        const session = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: returnUrl,
        });
        return NextResponse.json({ url: session.url });
    }

    // No Stripe customer yet → start checkout for selected tier
    const { tier } = await req.json();
    const priceIds = {
        starter:      process.env.STRIPE_STARTER_PRICE_ID,
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        business:     process.env.STRIPE_BUSINESS_PRICE_ID,
        scale:        process.env.STRIPE_SCALE_PRICE_ID,
    };
    const priceId = priceIds[tier];
    if (!priceId) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    const discounts = foundingDiscounts(org);   // founder/early-bird/early-adopter coupon, auto-applied
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        ...(discounts.length ? { discounts } : {}),
        ...(org.ownerEmail ? { customer_email: org.ownerEmail } : {}),
        metadata: { orgId: String(token.orgId), tier },
        success_url: `${returnUrl}?upgraded=1`,
        cancel_url: returnUrl,
    });
    return NextResponse.json({ url: session.url });
}
