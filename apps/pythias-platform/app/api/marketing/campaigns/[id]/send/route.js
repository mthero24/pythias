export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function POST(req, { params }) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    try { return NextResponse.json({ error: false, ...(await storefront.sendCampaign(orgId, id)) }); }
    catch (e) { return svcError(e); }
}
