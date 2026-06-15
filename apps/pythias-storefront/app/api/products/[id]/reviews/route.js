export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontReview, StorefrontReviewSummary, PlatformOrder, PlatformItem } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { recomputeSummary } from "@/lib/reviews";

const shape = (r) => ({
    id: String(r._id), authorName: r.authorName, rating: r.rating, title: r.title, body: r.body,
    photos: r.photos || [], verifiedBuyer: r.verifiedBuyer, helpfulCount: r.helpfulCount || 0,
    sellerReply: r.sellerReply?.body ? { body: r.sellerReply.body, at: r.sellerReply.at } : null,
    aiTags: r.aiTags || [], createdAt: r.createdAt,
});

// GET /api/products/[id]/reviews — published reviews + cached summary (incl. AI highlights).
export async function GET(req, { params }) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const productId = new mongoose.Types.ObjectId(id);

    const [summary, reviews] = await Promise.all([
        StorefrontReviewSummary.findOne({ orgId: ctx.orgId, productId }).lean(),
        StorefrontReview.find({ orgId: ctx.orgId, productId, status: "published" }).sort({ helpfulCount: -1, createdAt: -1 }).limit(100).lean(),
    ]);

    return NextResponse.json({
        error: false,
        summary: summary ? {
            avg: summary.avg, count: summary.count, distribution: summary.distribution,
            aiSummary: summary.aiSummary || null, aiPros: summary.aiPros || [], aiCons: summary.aiCons || [],
        } : { avg: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        reviews: reviews.map(shape),
    });
}

// POST /api/products/[id]/reviews — submit. Auth optional; signed-in buyers who ordered the
// product get a verified-buyer badge.
export async function POST(req, { params }) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const productId = new mongoose.Types.ObjectId(id);

    const auth = await getAuthedCustomer(req).catch(() => null);
    const b = await req.json().catch(() => null);
    const rating = Math.round(Number(b?.rating));
    if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    const authorName = (b?.authorName || auth?.customer?.name || "").toString().trim();
    const email = (b?.email || auth?.customer?.email || "").toString().trim().toLowerCase();
    if (!authorName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!auth && !email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Verified-buyer: did this customer order this product?
    let verifiedBuyer = false, orderId;
    const cust = auth?.customer;
    if (cust || email) {
        const orders = await PlatformOrder.find({
            orgId: ctx.orgId,
            ...(cust ? { $or: [{ storefrontCustomerId: cust._id }, { customerEmail: email }] } : { customerEmail: email }),
        }).select("_id").limit(50).lean();
        if (orders.length) {
            const item = await PlatformItem.findOne({ orgId: ctx.orgId, product: productId, order: { $in: orders.map((o) => o._id) } }).select("order").lean();
            if (item) { verifiedBuyer = true; orderId = item.order; }
        }
    }

    try {
        await StorefrontReview.create({
            orgId: ctx.orgId, productId, customerId: cust?._id, orderId,
            authorName, email: email || undefined, rating,
            title: b?.title?.toString().slice(0, 140), body: b?.body?.toString().slice(0, 4000),
            photos: Array.isArray(b?.photos) ? b.photos.slice(0, 6).map((p) => String(p).slice(0, 600)) : [],
            verifiedBuyer, status: "published",
        });
    } catch (e) {
        if (e?.code === 11000) return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });
        throw e;
    }

    await recomputeSummary(ctx.orgId, productId);
    return NextResponse.json({ error: false }, { status: 201 });
}
