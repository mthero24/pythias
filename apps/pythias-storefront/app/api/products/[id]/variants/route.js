export const dynamic = "force-dynamic";
import mongoose from "mongoose";
import { PlatformProduct, resolveVariantSize } from "@pythias/mongo";
import { resolveSite } from "@/lib/resolveSite";

// GET /api/products/:id/variants — variant options for the in-grid quick-add picker (color + size).
// Fetched on demand so the catalog payload stays small. :id is the product _id, slug, or sku.
export async function GET(req, { params }) {
    const { id } = await params;
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return Response.json({ error: "Unknown storefront" }, { status: 404 });

    const base = { orgId: site.orgId, active: { $ne: false } };
    let product = null;
    try {
        const pop = (qy) => qy.populate("variantsArray.color", "name hexcode").populate("variantsArray.blank", "sizes").select("title description productImages variantsArray");
        if (mongoose.Types.ObjectId.isValid(id)) product = await pop(PlatformProduct.findOne({ ...base, _id: id })).lean();
        if (!product) { const lc = String(id).toLowerCase(); product = await pop(PlatformProduct.findOne({ ...base, $or: [{ slug: lc }, { sku: id }, { slugAliases: lc }] })).lean(); }
    } catch { product = null; }
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });

    const variants = (product.variantsArray || []).map((v) => ({
        sku: v.sku || null,
        priceCents: typeof v.price === "number" && v.price > 0 ? Math.round(v.price * 100) : 0,
        image: v.image || null,
        color: v.color?.name || v.ids?.colorName || "",
        hex: v.color?.hexcode || null,
        size: resolveVariantSize(v, v.blank?.sizes),
    }));
    const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color, { name: v.color, hex: v.hex, image: variants.find((x) => x.color === v.color && x.image)?.image || null }])).values()];
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    // Full gallery for the quick-view carousel: product images first, then any distinct variant images.
    const images = [...new Set([
        ...(product.productImages || []).map((i) => i.image).filter(Boolean),
        ...variants.map((v) => v.image).filter(Boolean),
    ])];
    const image = images[0] || null;

    return Response.json({ error: false, title: product.title, description: product.description || "", image, images, variants, colors, sizes });
}
