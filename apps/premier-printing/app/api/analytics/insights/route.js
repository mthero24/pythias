export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const range = new URL(req.url).searchParams.get("range") || "30d";
    try { return NextResponse.json({ error: false, ...(await storefront.analyticsInsights(orgId, range)) }); }
    catch (e) { return svcError(e); }
}
