export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontReview } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";

// POST /api/reviews/[id]/helpful — mark a review helpful (+1). Org-scoped.
export async function POST(req, { params }) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await StorefrontReview.updateOne({ _id: id, orgId: ctx.orgId, status: "published" }, { $inc: { helpfulCount: 1 } });
    return NextResponse.json({ error: false });
}
