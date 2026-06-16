export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// Premier is the fulfiller's own org (no paid storefront subscription) → DB-only, no Stripe billing.
export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, ...(await storefront.listStores(orgId)) }); } catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.op === "add") { await storefront.addStore(orgId, b); return NextResponse.json({ error: false, ...(await storefront.listStores(orgId)) }); }
        if (b.op === "remove") { await storefront.removeStore(orgId, b.siteId); return NextResponse.json({ error: false, ...(await storefront.listStores(orgId)) }); }
        return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    } catch (e) { return svcError(e); }
}
