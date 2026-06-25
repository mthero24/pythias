export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, sessionUserEmail, svcError } from "@/lib/storefrontRoute";

// Recent-sends history for the seller's mobile-app push broadcasts (org-scoped).
export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, broadcasts: await storefront.listPushBroadcasts(orgId) }); }
    catch (e) { return svcError(e); }
}

// Send (or schedule) a broadcast push to this org's white-label app users. orgId comes from the
// platform session ONLY — never from the request body. Body may carry `segment` + `scheduledAt`.
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.sendPushBroadcast(orgId, b, await sessionUserEmail())) }); }
    catch (e) { return svcError(e); }
}

// Cancel a still-scheduled broadcast (?id=). Tenant-scoped to the session org.
export async function DELETE(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    try { return NextResponse.json({ error: false, ...(await storefront.cancelPushBroadcast(orgId, id)) }); }
    catch (e) { return svcError(e); }
}
