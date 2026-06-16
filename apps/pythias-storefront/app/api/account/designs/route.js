export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSavedDesign } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

const MAX_JSON = 600 * 1024;   // cap a saved design's serialized state (~600KB)

// GET /api/account/designs — list the signed-in buyer's saved designs (lightweight).
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const docs = await StorefrontSavedDesign.find({ orgId: auth.orgId, customerId: auth.customer._id })
        .select("name productTitle colorName sizeName thumbnail updatedAt design").sort({ updatedAt: -1 }).limit(60).lean();
    // Build a compact front-side preview (positions + art/text) so the UI can render a real mini mockup.
    const pick = (o) => ({ type: o.type, src: o.src, left: o.left, top: o.top, scaleX: o.scaleX, scaleY: o.scaleY, angle: o.angle, width: o.width, height: o.height, originX: o.originX, originY: o.originY, fontFamily: o.fontFamily, fill: o.fill, fontSize: o.fontSize, text: o.text });
    const designs = docs.map((d) => ({
        _id: d._id, name: d.name, productTitle: d.productTitle, colorName: d.colorName, sizeName: d.sizeName,
        thumbnail: d.thumbnail, updatedAt: d.updatedAt, preview: (d.design?.front || []).map(pick),
    }));
    return NextResponse.json({ error: false, designs });
}

// POST /api/account/designs — create or update a saved design.
// Body: { id?, blankId, name, styleCode, productTitle, colorName, sizeName, thumbnail, design }
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => null);
    if (!b?.blankId || !mongoose.Types.ObjectId.isValid(b.blankId)) return NextResponse.json({ error: "Pick a product first" }, { status: 400 });
    if (JSON.stringify(b.design || {}).length > MAX_JSON) return NextResponse.json({ error: "Design is too large to save" }, { status: 413 });

    const set = {
        orgId: auth.orgId, customerId: auth.customer._id, blankId: b.blankId,
        name: String(b.name || "Untitled design").slice(0, 120),
        styleCode: b.styleCode ? String(b.styleCode).slice(0, 60) : undefined,
        productTitle: b.productTitle ? String(b.productTitle).slice(0, 200) : undefined,
        colorName: b.colorName ? String(b.colorName).slice(0, 100) : undefined,
        sizeName: b.sizeName ? String(b.sizeName).slice(0, 60) : undefined,
        thumbnail: b.thumbnail ? String(b.thumbnail).slice(0, 600) : undefined,
        design: b.design && typeof b.design === "object" ? b.design : {},
    };

    if (b.id && mongoose.Types.ObjectId.isValid(b.id)) {
        const r = await StorefrontSavedDesign.findOneAndUpdate(
            { _id: b.id, orgId: auth.orgId, customerId: auth.customer._id }, { $set: set }, { new: true },
        ).select("_id").lean();
        if (!r) return NextResponse.json({ error: "Design not found" }, { status: 404 });
        return NextResponse.json({ error: false, id: String(r._id) });
    }
    const doc = await StorefrontSavedDesign.create(set);
    return NextResponse.json({ error: false, id: String(doc._id) });
}
