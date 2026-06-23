export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/marketing/render-preview — render a campaign email to HTML for the on-page preview.
// Body: { subject, html, blocks } → { html }
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.renderMarketingEmail(orgId, b)) }); }
    catch (e) { return svcError(e); }
}
