import { Organization, UsageLedger } from "@pythias/mongo";
import { TIERS, isUnlimited, calcOverage } from "./tiers";

// Called by a nightly cron or after every order write.
// Calculates overages, updates ledger, sends alerts at 75/90/100%.
export async function syncUsageLedger(orgId) {
    const org = await Organization.findById(orgId).lean();
    if (!org) return;

    const period = new Date().toISOString().slice(0, 7);
    const tier = TIERS[org.tier];
    if (!tier) return;

    const overageOrders = isUnlimited(org.limits.ordersPerMonth)
        ? 0
        : Math.max(0, org.usage.ordersThisMonth - org.limits.ordersPerMonth);

    const overageOrdersCharge = calcOverage(org.usage.ordersThisMonth, org.limits.ordersPerMonth, tier.overage.order);
    const extraUsers = Math.max(0, org.usage.usersTotal - org.limits.users);
    const extraUsersCharge = extraUsers * (tier.overage.user ?? 0);
    const totalOverageCharge = overageOrdersCharge + extraUsersCharge;

    await UsageLedger.findOneAndUpdate(
        { orgId, period },
        {
            $set: {
                orgId,
                period,
                periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                orders: org.usage.ordersThisMonth,
                overageOrders,
                overageOrdersCharge,
                extraUsers,
                extraUsersCharge,
                totalOverageCharge,
                products: org.usage.productsTotal,
                designs: org.usage.designsTotal,
            },
        },
        { upsert: true, new: true }
    );

    // Alert thresholds
    if (!isUnlimited(org.limits.ordersPerMonth)) {
        const pct = Math.round((org.usage.ordersThisMonth / org.limits.ordersPerMonth) * 100);
        const thresholds = [
            { key: '100pct', pct: 100 },
            { key: '90pct', pct: 90 },
            { key: '75pct', pct: 75 },
        ];
        for (const t of thresholds) {
            if (pct >= t.pct) {
                await sendUsageAlert(org, 'orders', pct, t.key);
                break;
            }
        }
    }
}

async function sendUsageAlert(org, resource, pct, threshold) {
    // Check if we already sent this alert this period
    const period = new Date().toISOString().slice(0, 7);
    const ledger = await UsageLedger.findOne({ orgId: org._id, period }).lean();
    const alreadySent = ledger?.alerts?.some(a => a.type === threshold && a.resource === resource);
    if (alreadySent) return;

    // Record that we sent it
    await UsageLedger.findOneAndUpdate(
        { orgId: org._id, period },
        { $push: { alerts: { type: threshold, resource, sentAt: new Date() } } }
    );

    // Email via process.env.ALERT_EMAIL_FROM using fetch to a transactional email API
    // (Resend, SendGrid, etc. — wire up to your preferred provider)
    const emailEndpoint = process.env.ALERT_EMAIL_ENDPOINT;
    if (!emailEndpoint) return;

    const nextTierMap = { starter: 'Professional ($599)', professional: 'Business ($1,499)', business: 'Scale ($3,000)' };
    const upgrade = nextTierMap[org.tier];

    await fetch(emailEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ALERT_EMAIL_KEY}` },
        body: JSON.stringify({
            to: org.billingEmail,
            subject: `Pythias: You've used ${pct}% of your ${resource} limit`,
            text: `Your organization "${org.name}" has used ${pct}% of its monthly ${resource} limit on the ${org.tier} plan.\n\n${upgrade ? `Consider upgrading to ${upgrade} to avoid overage charges.` : "Additional usage will be billed at your plan's overage rate."}\n\nView your usage: https://app.pythiastechnologies.com/billing`,
        }),
    }).catch(err => console.error("[usageAlerts] email failed", err));
}
