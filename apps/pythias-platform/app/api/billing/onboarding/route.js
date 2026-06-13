import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getStripe } from "@/lib/stripe";

const PACKAGES = {
    remote: { name: "Remote Onboarding — 5 days (Mon–Fri), 4 hrs/day", amount: 300000 },
};

export async function POST(req) {
    const stripe = getStripe();
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type } = await req.json();
    const pkg = PACKAGES[type];
    if (!pkg) return NextResponse.json({ error: "Invalid onboarding type" }, { status: 400 });

    const org = await Organization.findById(token.orgId).lean();
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const baseUrl = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
    const returnUrl = `${baseUrl}/${org.slug}/billing`;

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency: "usd",
                product_data: { name: pkg.name },
                unit_amount: pkg.amount,
            },
            quantity: 1,
        }],
        ...(org.stripeCustomerId ? { customer: org.stripeCustomerId } : {}),
        metadata: { orgId: String(token.orgId), type: "onboarding", onboardingType: type },
        success_url: `${returnUrl}?onboarding=purchased`,
        cancel_url: returnUrl,
    });
    return NextResponse.json({ url: session.url });
}
