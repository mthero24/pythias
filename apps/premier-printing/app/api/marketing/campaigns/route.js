export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, premierUser, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, campaigns: await storefront.listCampaigns(orgId) }); }
    catch (e) { return svcError(e); }
}

export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, campaign: await storefront.createCampaign(orgId, b, await premierUser(req)) }, { status: 201 }); }
    catch (e) { return svcError(e); }
}
