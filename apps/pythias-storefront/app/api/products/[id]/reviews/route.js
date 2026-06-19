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

// Did this customer/email order this product? (Verified-buyer proof, also the gate for verified-only stores.)
async function purchaseInfo(orgId, cust, email, productId) {
    if (!cust && !email) return { verified: false };
    const orders = await PlatformOrder.find({
        orgId,
        ...(cust ? { $or: [{ storefrontCustomerId: cust._id }, ...(email ? [{ customerEmail: email }] : [])] } : { customerEmail: email }),
    }).select("_id").limit(50).lean();
    if (!orders.length) return { verified: false };
    const item = await PlatformItem.findOne({ orgId, product: productId, order: { $in: orders.map((o) => o._id) } }).select("order").lean();
    return item ? { verified: true, orderId: item.order } : { verified: false };
}

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

    // Eligibility for the write-review form: when the store requires verified buyers, only a signed-in
    // customer who purchased this product can review.
    const verifiedOnly = ctx.site?.reviews?.verifiedOnly !== false;   // default: required
    const auth = await getAuthedCustomer(req).catch(() => null);
    const signedIn = !!auth?.customer;
    const canReview = !verifiedOnly || (signedIn && (await purchaseInfo(ctx.orgId, auth.customer, auth.customer.email, productId)).verified);

    return NextResponse.json({
        error: false,
        verifiedOnly, signedIn, canReview,
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
    const cust = auth?.customer;
    const { verified: verifiedBuyer, orderId } = await purchaseInfo(ctx.orgId, cust, email, productId);

    // Verified-only stores: a review requires a matching purchase (default on).
    const verifiedOnly = ctx.site?.reviews?.verifiedOnly !== false;
    if (verifiedOnly && !verifiedBuyer) {
        return NextResponse.json({ error: "Only verified buyers who purchased this product can leave a review." }, { status: 403 });
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
