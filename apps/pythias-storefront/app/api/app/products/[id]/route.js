export const dynamic = "force-dynamic";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { PlatformProduct, resolveVariantSize } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/app/products/:id — full product detail for the native app's product page.
// :id may be the product _id, slug, or sku. Tenant resolved by x-pythias-app-key (app) or host (web).
export async function GET(req, { params }) {
    const { id } = await params;
    const ctx = await resolveOrg(req);
    if (!ctx?.site) return NextResponse.json({ error: "unknown_app" }, { status: 404 });
    if (req.headers.get("x-pythias-app-key") && !ctx.site.appEnabled) {
        return NextResponse.json({ error: "app_not_enabled" }, { status: 403 });
    }

    const base = { orgId: ctx.orgId, active: { $ne: false } };
    const pop = (qy) => qy
        .populate("variantsArray.color", "name hexcode")
        .populate("variantsArray.blank", "sizes")
        .select("title description brand slug sku productImages variantsArray salePercent category department tags isCatalogProduct continueSellingOOS trackInventory aggregateRating");
    let product = null;
    try {
        if (mongoose.Types.ObjectId.isValid(id)) product = await pop(PlatformProduct.findOne({ ...base, _id: id })).lean();
        if (!product) { const lc = String(id).toLowerCase(); product = await pop(PlatformProduct.findOne({ ...base, $or: [{ slug: lc }, { sku: id }, { slugAliases: lc }] })).lean(); }
    } catch { product = null; }
    if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const salePct = Math.max(0, Math.min(100, Number(product.salePercent) || 0));
    const variants = (product.variantsArray || []).map((v) => {
        const base$ = typeof v.price === "number" && v.price > 0 ? v.price : 0;
        return {
            sku: v.sku || null,
            name: v.name || "",                                   // free-form option label (catalog products)
            priceCents: Math.round(base$ * 100 * (1 - salePct / 100)),
            compareAtCents: v.compareAtPrice ? Math.round(Number(v.compareAtPrice) * 100) : (salePct > 0 ? Math.round(base$ * 100) : 0),
            image: v.image || null,
            color: v.color?.name || v.ids?.colorName || "",
            hex: v.color?.hexcode || null,
            size: resolveVariantSize(v, v.blank?.sizes),
            stock: typeof v.stock === "number" ? v.stock : null,
        };
    });
    const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color, { name: v.color, hex: v.hex, image: variants.find((x) => x.color === v.color && x.image)?.image || null }])).values()];
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    const options = [...new Set(variants.map((v) => v.name).filter(Boolean))];   // catalog free-form options
    const images = [...new Set([
        ...(product.productImages || []).map((i) => i.image).filter(Boolean),
        ...variants.map((v) => v.image).filter(Boolean),
    ])];
    const prices = variants.map((v) => v.priceCents).filter((c) => c > 0);

    return NextResponse.json({
        error: false,
        product: {
            id: String(product._id),
            title: product.title,
            description: product.description || "",
            brand: product.brand || "",
            slug: product.slug || "",
            sku: product.sku || "",
            category: product.category || [],
            department: product.department || [],
            tags: product.tags || [],
            images,
            variants,
            colors,
            sizes,
            options,
            hasOptions: options.length > 0,
            priceFromCents: prices.length ? Math.min(...prices) : 0,
            priceToCents: prices.length ? Math.max(...prices) : 0,
            salePercent: salePct,
            rating: product.aggregateRating || null,
            isCatalogProduct: !!product.isCatalogProduct,
            continueSellingOOS: !!product.continueSellingOOS,
            trackInventory: product.trackInventory !== false,
        },
    });
}
