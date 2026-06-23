export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/marketing/generate-image — generate one AI image for the email builder. Body: { prompt } → { url }
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { prompt } = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.generateEmailImage(orgId, prompt)) }); }
    catch (e) { return svcError(e); }
}
