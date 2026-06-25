export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, premierUser, svcError } from "@/lib/storefrontOrg";

// Recent-sends history for the seller's mobile-app push broadcasts (org-scoped).
export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, broadcasts: await storefront.listPushBroadcasts(orgId) }); }
    catch (e) { return svcError(e); }
}

// Send a broadcast push to this org's white-label app users. orgId comes from auth ONLY.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.sendPushBroadcast(orgId, b, await premierUser(req))) }); }
    catch (e) { return svcError(e); }
}
