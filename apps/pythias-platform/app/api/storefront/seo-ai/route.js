export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/storefront/seo-ai — AI-write an SEO title + meta description. Body: { kind:"site"|"page", title?, hint? }.
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const seo = await storefront.generateSeoMeta(orgId, { kind: body?.kind, title: body?.title, hint: body?.hint });
        return NextResponse.json({ error: false, ...seo });
    } catch (e) { return svcError(e); }
}
