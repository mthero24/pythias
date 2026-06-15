export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, popup: await storefront.getPopup(orgId) }); }
    catch (e) { return svcError(e); }
}

export async function PUT(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { await storefront.savePopup(orgId, b); return NextResponse.json({ error: false }); }
    catch (e) { return svcError(e); }
}
