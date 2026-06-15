export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function GET(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const status = new URL(req.url).searchParams.get("status") || undefined;
    try { return NextResponse.json({ error: false, reviews: await storefront.listSellerReviews(orgId, status) }); } catch (e) { return svcError(e); }
}
