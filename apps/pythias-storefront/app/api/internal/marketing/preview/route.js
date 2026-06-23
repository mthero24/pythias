export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { sendEmail, brandedFrom, baseTemplate, renderBlocks } from "@/lib/email";
import { resolveCampaignBlocks } from "@/lib/emailProducts";
import { storeBaseUrl, logoOf, logoHeightOf } from "@/lib/marketing";
import { sendSMS } from "@/lib/sms";

// POST /api/internal/marketing/preview — send ONE preview email/SMS immediately (to the seller's own
// address/phone) so they can test a campaign or automation step before it goes to customers.
// Internal (platform-gated). Body: { orgId, channel, subject, html, body, to }
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { orgId, channel, subject, html, body, blocks, to } = await req.json().catch(() => ({}));
    if (!to) return NextResponse.json({ error: "A recipient is required" }, { status: 400 });

    if (channel === "sms") {
        if (!body) return NextResponse.json({ error: "SMS body is required" }, { status: 400 });
        const r = await sendSMS({ to, body: `[Preview] ${body}` });
        return r.ok ? NextResponse.json({ ok: true, id: r.id }) : NextResponse.json({ error: r.error || "SMS failed" }, { status: 502 });
    }

    const hasBlocks = Array.isArray(blocks) && blocks.length;
    if (!subject || (!html && !hasBlocks)) return NextResponse.json({ error: "Email subject and content are required" }, { status: 400 });

    const site = orgId ? await StorefrontSite.findOne({ orgId }).select("name customDomain subdomain businessInfo logoUrl logoStyle theme.logoUrl theme.logoStyle theme.logoHeight").lean() : null;
    const brand = site?.businessInfo?.legalName || site?.name || "Our Store";
    const baseUrl = storeBaseUrl(site);
    const logo = logoOf(site, baseUrl);
    const logoHeight = logoHeightOf(site);
    const contentHtml = hasBlocks ? await renderBlocks(await resolveCampaignBlocks(orgId, blocks, baseUrl)) : (html || "");
    const fullHtml = await baseTemplate({ brand, logo, logoHeight, contentHtml, footerHtml: `${brand} · This is a preview.` });
    const r = await sendEmail({ to, subject: `[Preview] ${subject}`, html: fullHtml, from: brandedFrom(site?.name) });
    return r.ok ? NextResponse.json({ ok: true, id: r.id }) : NextResponse.json({ error: r.error || "Email failed" }, { status: 502 });
}
