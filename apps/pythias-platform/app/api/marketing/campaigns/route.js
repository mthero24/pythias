export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, sessionUserEmail, svcError } from "@/lib/storefrontRoute";

export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, campaigns: await storefront.listCampaigns(orgId) }); }
    catch (e) { return svcError(e); }
}

export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, campaign: await storefront.createCampaign(orgId, b, await sessionUserEmail()) }, { status: 201 }); }
    catch (e) { return svcError(e); }
}
