export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCampaign, StorefrontCustomer, StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { baseTemplate } from "@/lib/email";
import { enqueueMessage, unsubscribeUrl } from "@/lib/marketing";

// POST /api/internal/marketing/campaign-send  (triggered by the platform "Send" action)
// Fans a campaign out into the outbox, one message per opted-in/non-suppressed recipient,
// staggered over time so the outbox sends slowly and builds sender reputation.
const SPACING_MS = Math.max(0, Number(process.env.CAMPAIGN_SPACING_MS) || 3000);

export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { campaignId } = await req.json().catch(() => ({}));
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    const camp = await StorefrontCampaign.findById(campaignId);
    if (!camp) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (["sending", "sent"].includes(camp.status)) return NextResponse.json({ error: "Campaign already sent" }, { status: 409 });

    const site = await StorefrontSite.findOne({ orgId: camp.orgId }).lean();
    const brand = site?.businessInfo?.legalName || site?.name || "Our Store";

    // Audience: opted-in for this channel, plus the chosen segment.
    const consentField = camp.channel === "sms" ? "marketingConsent.sms.optedIn" : "marketingConsent.email.optedIn";
    const contactField = camp.channel === "sms" ? "phone" : "email";
    const q = { orgId: camp.orgId, [consentField]: true, [contactField]: { $exists: true, $ne: null } };
    if (camp.audience === "customers") q.passwordHash = { $exists: true, $ne: null };
    else if (camp.audience === "leads") q.isLead = true;

    const recipients = await StorefrontCustomer.find(q).select(`_id ${contactField}`).limit(50000).lean();

    camp.status = "sending"; camp.sentAt = new Date(); camp.stats.recipients = recipients.length;
    await camp.save();

    const now = Date.now();
    let queued = 0;
    for (let i = 0; i < recipients.length; i++) {
        const to = recipients[i][contactField];
        if (!to) continue;
        const scheduledAt = new Date(now + i * SPACING_MS);   // warmup stagger

        const common = {
            orgId: camp.orgId, channel: camp.channel, to, customerId: recipients[i]._id,
            campaignId: camp._id, type: "campaign", category: "marketing",
            dedupeKey: `campaign:${camp._id}:${String(to).toLowerCase()}`, scheduledAt,
        };

        let msg;
        if (camp.channel === "sms") {
            msg = await enqueueMessage({ ...common, body: `${camp.body}\nReply STOP to opt out.` }).catch(() => null);
        } else {
            const html = baseTemplate({
                brand, contentHtml: camp.html || "",
                footerHtml: `You're receiving this because you subscribed at ${brand}.<br><a href="${unsubscribeUrl({ ...site, orgId: camp.orgId }, "email", to)}" style="color:#94a3b8">Unsubscribe</a>`,
            });
            msg = await enqueueMessage({ ...common, subject: camp.subject, html }).catch(() => null);
        }
        if (msg) queued++;
    }

    camp.stats.queued = queued;
    camp.stats.skipped = recipients.length - queued;
    camp.status = "sent";
    await camp.save();

    return NextResponse.json({ ok: true, recipients: recipients.length, queued });
}
