export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// POST /api/marketing/preview — send a test email/SMS of a campaign/automation to the seller.
// Body: { channel, subject, html, body, to }
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.sendMarketingPreview(orgId, b)) }); }
    catch (e) { return svcError(e); }
}
