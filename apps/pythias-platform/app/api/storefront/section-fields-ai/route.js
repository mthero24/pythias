export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/storefront/section-fields-ai — AI-rewrite a section's settings (copy/links/colors) from a
// description. Body: { type, settings, prompt }. Returns { fields } (a partial settings patch).
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { fields } = await storefront.generateSectionFields(orgId, { type: body?.type, settings: body?.settings, prompt: body?.prompt });
        return NextResponse.json({ error: false, fields });
    } catch (e) { return svcError(e); }
}
