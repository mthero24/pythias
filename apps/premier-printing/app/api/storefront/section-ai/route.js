export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// POST /api/storefront/section-ai — AI-build/edit a custom-HTML section. Body: { prompt, currentHtml? }.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { html } = await storefront.generateSection(orgId, { prompt: body?.prompt, currentHtml: body?.currentHtml });
        return NextResponse.json({ error: false, html });
    } catch (e) { return svcError(e); }
}
