export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const status = new URL(req.url).searchParams.get("status") || undefined;
    try { return NextResponse.json({ error: false, reviews: await storefront.listSellerReviews(orgId, status) }); } catch (e) { return svcError(e); }
}
