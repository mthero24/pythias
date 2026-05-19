import { Products } from "@pythias/mongo";
import { NextResponse } from "next/server";

// variant.size is a string ID matching blank.sizes[]._id
function resolveSizeName(sizeId, blank) {
    if (!sizeId || !blank?.sizes) return null;
    return blank.sizes.find(s => s._id.toString() === sizeId)?.name ?? null;
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku")?.trim();
    if (!sku) return NextResponse.json({ error: "sku required" }, { status: 400 });

    // Match on product-level sku OR variant sku
    const product = await Products.findOne({
        $or: [
            { sku },
            { "variantsArray.sku": sku },
        ],
    })
        .populate("variantsArray.color", "name hexcode sku")
        .populate("blanks", "name code sizes")
        .populate("design", "images threadImages printType sku")
        .select("title sku variantsArray blanks design productImages")
        .lean();

    if (!product) return NextResponse.json({ error: "No product found for that SKU" }, { status: 404 });

    // Prefer variant SKU match; fall back to first variant if only product SKU matched
    const variant = product.variantsArray?.find(v => v.sku === sku)
        ?? product.variantsArray?.[0]
        ?? null;
    if (!variant) return NextResponse.json({ error: "No variants found" }, { status: 404 });

    const blankId = variant.blank?.toString();
    const blank   = product.blanks?.find(b => b._id.toString() === blankId)
        ?? product.blanks?.[0]
        ?? null;

    // All variants for this blank
    const blankVariants = product.variantsArray.filter(v => v.blank?.toString() === blankId);

    // Unique colors
    const colorsMap = new Map();
    for (const v of blankVariants) {
        if (v.color?._id) colorsMap.set(v.color._id.toString(), v.color);
    }

    // Blank sizes (non-hidden) — used to map sizeId → name and for Item.size
    const blankSizes = (blank?.sizes ?? [])
        .filter(s => !s.hidden)
        .map(s => ({ _id: s._id.toString(), name: s.name, sku: s.sku }));

    // Product images keyed by colorId for fast lookup in the UI
    const productImagesByColor = {};
    for (const pi of product.productImages ?? []) {
        const cid = pi.color?.toString();
        if (cid && pi.image && !productImagesByColor[cid]) {
            productImagesByColor[cid] = pi.image;
        }
    }

    return NextResponse.json({
        title:    product.title,
        sku:      product.sku ?? sku,
        designId: product.design?._id ?? null,
        design:   product.design ?? null,
        blank:    blank ? { _id: blank._id.toString(), code: blank.code, name: blank.name, sizes: blankSizes } : null,
        colors:   [...colorsMap.values()],
        productImagesByColor,
        variants: blankVariants.map(v => ({
            sku:      v.sku,
            colorId:  v.color?._id?.toString() ?? null,
            sizeId:   v.size ?? null,
            sizeName: resolveSizeName(v.size, blank),
            price:    v.price ?? null,
            image:    v.image ?? null,
        })),
        selectedVariant: {
            sku:       variant.sku,
            colorId:   variant.color?._id?.toString() ?? null,
            colorName: variant.color?.name ?? null,
            colorHex:  variant.color?.hexcode ?? null,
            sizeId:    variant.size ?? null,
            sizeName:  resolveSizeName(variant.size, blank),
            price:     variant.price ?? null,
            image:     variant.image ?? null,
        },
    });
}
