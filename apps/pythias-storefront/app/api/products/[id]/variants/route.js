export const dynamic = "force-dynamic";
import mongoose from "mongoose";
import { PlatformProduct } from "@pythias/mongo";
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
        if (mongoose.Types.ObjectId.isValid(id)) product = await PlatformProduct.findOne({ ...base, _id: id }).populate("variantsArray.color", "name hexcode").select("title productImages variantsArray").lean();
        if (!product) { const lc = String(id).toLowerCase(); product = await PlatformProduct.findOne({ ...base, $or: [{ slug: lc }, { sku: id }, { slugAliases: lc }] }).populate("variantsArray.color", "name hexcode").select("title productImages variantsArray").lean(); }
    } catch { product = null; }
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });

    const variants = (product.variantsArray || []).map((v) => ({
        sku: v.sku || null,
        priceCents: typeof v.price === "number" && v.price > 0 ? Math.round(v.price * 100) : 0,
        image: v.image || null,
        color: v.color?.name || v.ids?.colorName || "",
        hex: v.color?.hexcode || null,
        size: (typeof v.size === "string" ? v.size : v.ids?.sizeName) || "",
    }));
    const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color, { name: v.color, hex: v.hex, image: variants.find((x) => x.color === v.color && x.image)?.image || null }])).values()];
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    const image = product.productImages?.find((i) => i.image)?.image || variants.find((v) => v.image)?.image || null;

    return Response.json({ error: false, title: product.title, image, variants, colors, sizes });
}
