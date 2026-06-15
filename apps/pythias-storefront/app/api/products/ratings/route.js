export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontReviewSummary } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";

// POST /api/products/ratings — { ids:[...] } → { ratings: { id: {avg,count} } } for showing
// stars on product cards (search/collections/listing).
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const body = await req.json().catch(() => null);
    const ids = (body?.ids || []).filter((id) => mongoose.Types.ObjectId.isValid(id)).slice(0, 200).map((id) => new mongoose.Types.ObjectId(id));
    if (!ids.length) return NextResponse.json({ error: false, ratings: {} });

    const rows = await StorefrontReviewSummary.find({ orgId: ctx.orgId, productId: { $in: ids }, count: { $gt: 0 } }).select("productId avg count").lean();
    const ratings = {};
    for (const r of rows) ratings[String(r.productId)] = { avg: r.avg, count: r.count };
    return NextResponse.json({ error: false, ratings });
}
