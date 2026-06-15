export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function PUT(req, { params }) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, page: await storefront.updatePage(orgId, id, b) }); }
    catch (e) { return svcError(e); }
}

export async function DELETE(req, { params }) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    try { await storefront.deletePage(orgId, id); return NextResponse.json({ error: false }); }
    catch (e) { return svcError(e); }
}
