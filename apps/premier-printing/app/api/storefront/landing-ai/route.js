export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// POST /api/storefront/landing-ai — AI-build a whole landing page. Body: { prompt }.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const page = await storefront.generateLandingPage(orgId, { prompt: body?.prompt });
        return NextResponse.json({ error: false, ...page });
    } catch (e) { return svcError(e); }
}
