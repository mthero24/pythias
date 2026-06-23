export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { baseTemplate, renderBlocks } from "@/lib/email";
import { resolveCampaignBlocks } from "@/lib/emailProducts";
import { storeBaseUrl } from "@/lib/marketing";

// POST /api/internal/marketing/render — return the fully-rendered email HTML for an on-page preview.
// Does NOT send. Internal (platform-gated). Body: { orgId, subject, html, blocks }
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { orgId, html, blocks } = await req.json().catch(() => ({}));
    const site = orgId ? await StorefrontSite.findOne({ orgId }).select("name customDomain subdomain businessInfo logoUrl logoStyle").lean() : null;
    const brand = site?.businessInfo?.legalName || site?.name || "Our Store";
    const baseUrl = storeBaseUrl(site);
    const logo = site?.logoUrl && site?.logoStyle !== "name" ? (site.logoUrl.startsWith("http") ? site.logoUrl : `${baseUrl}${site.logoUrl}`) : "";

    const hasBlocks = Array.isArray(blocks) && blocks.length;
    const contentHtml = hasBlocks ? await renderBlocks(await resolveCampaignBlocks(orgId, blocks, baseUrl)) : (html || "");
    const full = await baseTemplate({ brand, logo, contentHtml, footerHtml: `${brand} · Preview` });
    return NextResponse.json({ html: full });
}
