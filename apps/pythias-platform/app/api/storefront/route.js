export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function GET(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const siteId = new URL(req.url).searchParams.get("store") || undefined;   // multi-store: which site to edit
    try { return NextResponse.json({ error: false, site: await storefront.getSiteForEdit(orgId, siteId) }); }
    catch (e) { return svcError(e); }
}

export async function PUT(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try { await storefront.saveSiteDraft(orgId, body?.draft, body?.siteId); return NextResponse.json({ error: false }); }
    catch (e) { return svcError(e); }
}
