export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/storefront/prompt-builder — expand a rough idea into a strong, catalog-grounded prompt for
// the page/section AI builder. Body: { idea, kind?: "landing" | "section" }. Returns { prompt }.
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { prompt } = await storefront.improvePrompt(orgId, { idea: body?.idea, kind: body?.kind });
        return NextResponse.json({ error: false, prompt });
    } catch (e) { return svcError(e); }
}
