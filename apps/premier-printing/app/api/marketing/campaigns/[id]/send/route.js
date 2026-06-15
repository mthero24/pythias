export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function POST(req, { params }) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    try { return NextResponse.json({ error: false, ...(await storefront.sendCampaign(orgId, id)) }); }
    catch (e) { return svcError(e); }
}
