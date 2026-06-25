export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// Recipient-count preview for the push composer: how many of this org's app users have a push token.
export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const segment = new URL(req.url).searchParams.get("segment") || undefined;
    try { return NextResponse.json({ error: false, ...(await storefront.pushAudienceCount(orgId, segment)) }); }
    catch (e) { return svcError(e); }
}
