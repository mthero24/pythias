export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// GET /api/storefront/experiments/targets — pages → sections that can be A/B tested (for the composer).
export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, pages: await storefront.experimentTargets(orgId) }); } catch (e) { return svcError(e); }
}
