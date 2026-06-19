export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// POST /api/storefront/collage-ai — AI-design/revise a full image-collage layout. Body: { prompt, current? }.
// Returns { rows }.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { rows } = await storefront.generateCollage(orgId, { prompt: body?.prompt, current: body?.current });
        return NextResponse.json({ error: false, rows });
    } catch (e) { return svcError(e); }
}
