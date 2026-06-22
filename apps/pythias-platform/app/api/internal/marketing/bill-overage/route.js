export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Organization, UsageLedger, StorefrontSite } from "@pythias/mongo";
import { getStripe } from "@/lib/stripe";
import { STOREFRONT_PLAN_LIMITS } from "@/lib/storefrontPlans";

// POST /api/internal/marketing/bill-overage — bills each storefront's email/SMS overage for a month
// as a Stripe INVOICE ITEM on the org's customer, so it rides their next storefront subscription
// invoice. Run monthly by PM2 (early on the 1st). Body: { period? } defaults to LAST month.
// Idempotent via UsageLedger.marketingBilled (a failed charge is NOT marked, so it retries).
function lastMonth() {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
}

export async function POST(req) {
    if (!process.env.PYTHIAS_INTERNAL_KEY || req.headers.get("x-pythias-internal-key") !== process.env.PYTHIAS_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const period = body?.period || lastMonth();

    const ledgers = await UsageLedger.find({ period, marketingBilled: { $ne: true } }).lean();
    let billed = 0, charged = 0, skipped = 0;

    for (const l of ledgers) {
        // Comped/free accounts are never charged marketing overage.
        const org = await Organization.findById(l.orgId).select("stripeCustomerId comp").lean();
        if (org?.comp) {
            await UsageLedger.updateOne({ _id: l._id }, { $set: { overageEmailsCharge: 0, overageSmsCharge: 0, marketingBilled: true } });
            skipped++; continue;
        }
        // The org's storefront plan sets the allowance + overage rates.
        const site = await StorefrontSite.findOne({ orgId: l.orgId, plan: { $ne: "none" } }).select("plan").lean();
        const m = site?.plan ? STOREFRONT_PLAN_LIMITS[site.plan]?.marketing : null;
        if (!m) { skipped++; continue; }   // no storefront subscription → nothing to bill

        const overEmails = Math.max(0, (l.emailsSent || 0) - (m.includedEmails || 0));
        const overSms    = Math.max(0, (l.smsSent || 0) - (m.includedSms || 0));
        const emailCharge = overEmails * (m.emailOverage || 0);
        const smsCharge   = overSms * (m.smsOverage || 0);
        const totalCents  = Math.round((emailCharge + smsCharge) * 100);

        const set = { overageEmailsCharge: emailCharge, overageSmsCharge: smsCharge, marketingBilled: true };
        if (totalCents > 0) {
            if (org?.stripeCustomerId) {
                try {
                    const item = await stripe.invoiceItems.create({
                        customer: org.stripeCustomerId,
                        amount: totalCents,
                        currency: "usd",
                        description: `Email/SMS marketing overage — ${period} (${overEmails} emails, ${overSms} SMS over plan)`,
                    });
                    set.marketingInvoiceItemId = item.id;
                    charged++;
                } catch (e) {
                    console.error("[bill-overage] invoice item failed for", String(l.orgId), e.message);
                    continue;   // leave unbilled → retried on the next run
                }
            }
        }
        await UsageLedger.updateOne({ _id: l._id }, { $set: set });
        billed++;
    }
    return NextResponse.json({ ok: true, period, ledgers: ledgers.length, billed, charged, skipped });
}
