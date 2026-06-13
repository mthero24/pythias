export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Organization } from "@pythias/mongo";
import { getStripe } from "@/lib/stripe";

// GET /api/fulfillment/wallet — return current wallet state
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(session.user.orgId, "wallet orgType").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (org.orgType !== "commerce") return NextResponse.json({ error: "Not a Commerce Cloud org" }, { status: 403 });

    return NextResponse.json({ error: false, wallet: org.wallet ?? {} });
}

// POST /api/fulfillment/wallet
// Body: { action: "add-funds", amountCents: number }
//       { action: "update-settings", minimumBalance: number, autoRechargeAmount: number, autoRechargeEnabled: boolean }
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(session.user.orgId, "wallet orgType name slug stripeCustomerId").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (org.orgType !== "commerce") return NextResponse.json({ error: "Not a Commerce Cloud org" }, { status: 403 });

    const body = await req.json();

    if (body.action === "add-funds") {
        const amount = Math.round(Number(body.amountCents));
        if (!amount || amount < 100) return NextResponse.json({ error: "Minimum is $1.00" }, { status: 400 });

        const stripe = getStripe();

        // Ensure the org has a Stripe customer so the card can be saved for auto-recharge.
        let customerId = org.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: org.name,
                email: session.user.email ?? undefined,
                metadata: { orgId: String(org._id) },
            });
            customerId = customer.id;
            await Organization.updateOne({ _id: org._id }, { $set: { stripeCustomerId: customerId } });
        }

        const base = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
        const returnUrl = `${base?.replace(/\/$/, "")}/${org.slug}/fulfillment/wallet`;
        const meta = { orgId: String(org._id), kind: "wallet_topup", amountCents: String(amount) };

        const checkout = await stripe.checkout.sessions.create({
            mode: "payment",
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [{
                price_data: { currency: "usd", product_data: { name: "Pythias wallet funds" }, unit_amount: amount },
                quantity: 1,
            }],
            // Save the card to the customer so auto-recharge can charge it off-session later.
            payment_intent_data: { setup_future_usage: "off_session", metadata: meta },
            metadata: meta,
            success_url: `${returnUrl}?funded=success`,
            cancel_url: `${returnUrl}?funded=cancel`,
        });

        return NextResponse.json({ error: false, url: checkout.url });
    }

    if (body.action === "update-settings") {
        const update = {};
        if (body.minimumBalance     != null) update["wallet.minimumBalance"]      = Math.round(Number(body.minimumBalance));
        if (body.autoRechargeAmount != null) update["wallet.autoRechargeAmount"]  = Math.round(Number(body.autoRechargeAmount));
        if (body.autoRechargeEnabled != null) update["wallet.autoRechargeEnabled"] = Boolean(body.autoRechargeEnabled);

        await Organization.updateOne({ _id: session.user.orgId }, { $set: update });
        const updated = await Organization.findById(session.user.orgId, "wallet").lean();
        return NextResponse.json({ error: false, wallet: updated.wallet });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
