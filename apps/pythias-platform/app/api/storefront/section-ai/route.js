export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/storefront/section-ai — AI-build a custom-HTML section from a description, or apply a change
// to existing HTML. Body: { prompt, currentHtml? }. Returns { html }.
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { html } = await storefront.generateSection(orgId, { prompt: body?.prompt, currentHtml: body?.currentHtml });
        return NextResponse.json({ error: false, html });
    } catch (e) { return svcError(e); }
}
