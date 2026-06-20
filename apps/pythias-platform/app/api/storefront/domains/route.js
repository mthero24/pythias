export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function GET(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const siteId = new URL(req.url).searchParams.get("store") || undefined;
    try { return NextResponse.json({ error: false, domain: await storefront.customDomainStatus(orgId, siteId) }); }
    catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, domain: await storefront.addCustomDomain(orgId, b) }); }
    catch (e) { return svcError(e); }
}
export async function DELETE(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const siteId = new URL(req.url).searchParams.get("store") || undefined;
    try { return NextResponse.json({ error: false, ...(await storefront.removeCustomDomain(orgId, siteId)) }); }
    catch (e) { return svcError(e); }
}
