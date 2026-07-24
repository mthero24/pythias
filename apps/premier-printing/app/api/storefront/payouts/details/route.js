export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { premierAuthedOrg } from "@/lib/storefrontOrg";
import Stripe from "stripe";

const VALID = ["daily", "weekly", "monthly"];
const stripeClient = () => new Stripe(process.env.STOREFRONT_STRIPE_SECRET);

async function acctIdFor(orgId) {
    const org = await Organization.findById(orgId).select("storefrontConnect").lean();
    return org?.storefrontConnect?.accountId || null;
}

// GET — balance (next payout), payout schedule, and recent payouts for the connected account.
export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const acctId = await acctIdFor(orgId);
    if (!acctId) return NextResponse.json({ error: "No payout account" }, { status: 400 });
    try {
        const stripe = stripeClient();
        const [balance, acct, payouts] = await Promise.all([
            stripe.balance.retrieve({}, { stripeAccount: acctId }),
            stripe.accounts.retrieve(acctId),
            stripe.payouts.list({ limit: 12 }, { stripeAccount: acctId }),
        ]);
        const sum = (arr) => (arr || []).reduce((s, b) => s + b.amount, 0);
        return NextResponse.json({
            available: sum(balance.available),
            pending:   sum(balance.pending),
            currency:  balance.available?.[0]?.currency || "usd",
            schedule:  acct.settings?.payouts?.schedule?.interval || "daily",
            payouts:   payouts.data.map((p) => ({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, arrival_date: p.arrival_date, created: p.created })),
        });
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// POST { interval } — set how often Stripe pays the connected account out to their bank.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const acctId = await acctIdFor(orgId);
    if (!acctId) return NextResponse.json({ error: "No payout account" }, { status: 400 });
    const { interval } = await req.json().catch(() => ({}));
    if (!VALID.includes(interval)) return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    try {
        await stripeClient().accounts.update(acctId, { settings: { payouts: { schedule: { interval } } } });
        return NextResponse.json({ ok: true, schedule: interval });
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
