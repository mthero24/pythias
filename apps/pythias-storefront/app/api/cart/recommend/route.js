export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformProduct } from "@pythias/mongo";
import { productCardData, dedupeByDesign } from "@pythias/storefront";

const SELECT = "title slug sku brand productImages variantsArray category department design designTemplateId createdAt salePercent";

// POST /api/cart/recommend — "you might also like" for the cart. Body: { productIds: [] }.
// Related by the cart products' category/department (excluding what's in the cart); falls back to newest.
export async function POST(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const ids = (body.productIds || []).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const base = { orgId: site.orgId, active: { $ne: false } };
    try {
        if (ids.length) {
            const inCart = await PlatformProduct.find({ ...base, _id: { $in: ids } }).select("category department").lean();
            const cats = [...new Set(inCart.flatMap((p) => [...(p.category || []), ...(p.department || [])]).filter(Boolean))];
            const q = { ...base, _id: { $nin: ids } };
            if (cats.length) q.$or = [{ category: { $in: cats } }, { department: { $in: cats } }];
            const docs = await PlatformProduct.find(q).populate([{ path: "variantsArray.color", select: "name hexcode" }, { path: "variantsArray.blank", select: "sizes" }]).select(SELECT).sort({ _id: -1 }).limit(18).lean();
            const cards = dedupeByDesign(docs.map(productCardData)).slice(0, 6);
            if (cards.length) return NextResponse.json({ error: false, products: cards });
        }
        const docs = await PlatformProduct.find({ ...base, ...(ids.length ? { _id: { $nin: ids } } : {}) })
            .populate([{ path: "variantsArray.color", select: "name hexcode" }, { path: "variantsArray.blank", select: "sizes" }]).select(SELECT).sort({ _id: -1 }).limit(12).lean();
        return NextResponse.json({ error: false, products: dedupeByDesign(docs.map(productCardData)).slice(0, 6) });
    } catch {
        return NextResponse.json({ error: false, products: [] });
    }
}
