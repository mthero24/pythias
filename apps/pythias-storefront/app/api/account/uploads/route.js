export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

const MAX = 100;   // cap how many images we keep per buyer

// GET /api/account/uploads — the buyer's reusable design-image library.
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: false, uploads: auth.customer.designUploads ?? [] });
}

// POST /api/account/uploads — add an image URL to the library (most-recent first, deduped).
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== "string") return NextResponse.json({ error: "url required" }, { status: 400 });
    // Prepend (most-recent first), dedupe, cap.
    await StorefrontCustomer.updateOne({ _id: auth.customer._id, orgId: auth.orgId }, [{
        $set: { designUploads: { $slice: [{ $concatArrays: [[url], { $filter: { input: { $ifNull: ["$designUploads", []] }, cond: { $ne: ["$$this", url] } } }] }, MAX] } },
    }]);
    return NextResponse.json({ error: false });
}

// DELETE /api/account/uploads — remove an image URL. Body: { url }
export async function DELETE(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { url } = await req.json().catch(() => ({}));
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    await StorefrontCustomer.updateOne({ _id: auth.customer._id, orgId: auth.orgId }, { $pull: { designUploads: url } });
    return NextResponse.json({ error: false });
}
