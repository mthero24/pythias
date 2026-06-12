import { PlatformProduct as Products, PlatformBlank as Blank } from "@pythias/mongo";

const eq = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// Resolve a garment from the blank (garment) catalog by style code, plus color/size
// by name. Used for custom order lines that ship their own design artwork — the
// product (design+blank combo) need not exist, only the blank does. Returns null
// if no blank matches the code (or no code given).
export async function resolveBlankByCode(orgId, code, colorName, sizeName) {
    if (!code) return null;
    const blank = await Blank.findOne({ orgId, code: code.toString().trim() })
        .populate("colors", "name hexcode sku")
        .select("code colors sizes")
        .lean();
    if (!blank) return null;

    const color = (blank.colors ?? []).find((c) => eq(c.name, colorName) || eq(c.sku, colorName)) ?? null;
    const sizeEntry = (blank.sizes ?? []).find((s) => eq(s.name, sizeName) || eq(s.sku, sizeName)) ?? null;

    return {
        blank:     blank._id,
        styleCode: blank.code,
        color:     color?._id ?? null,
        colorName: color?.name ?? colorName ?? "",
        size:      sizeEntry?._id ?? null,
        sizeName:  sizeEntry?.name ?? sizeName ?? "",
    };
}

// Resolve a single SKU against an org's catalog to the component fields an Item
// (and routeOrder) need: blank, color, sizeName, styleCode, design. Returns null
// if the SKU matches no product/variant for this org.
// Ported from app/api/orders/lookup-product/route.js, scoped by orgId.
export async function resolveLineBySku(orgId, sku) {
    const product = await Products.findOne({
        orgId,
        $or: [{ sku }, { "variantsArray.sku": sku }],
    })
        .populate("variantsArray.color", "name hexcode sku")
        .populate("blanks", "code sizes")
        .populate("design", "images sku")
        .select("title sku variantsArray blanks design")
        .lean();

    if (!product) return null;

    const variant = product.variantsArray?.find((v) => v.sku === sku)
        ?? product.variantsArray?.[0]
        ?? null;
    if (!variant) return null;

    const blankId = variant.blank?.toString();
    const blank   = product.blanks?.find((b) => b._id.toString() === blankId)
        ?? product.blanks?.[0]
        ?? null;

    // variant.size may be a blank.sizes _id, a size name, or a size sku — match any.
    const sizeEntry = blank?.sizes?.find((s) =>
        s._id.toString() === String(variant.size) || s.name === variant.size || s.sku === variant.size,
    ) ?? null;
    const sizeName = sizeEntry?.name
        ?? variant.ids?.sizeName
        ?? (typeof variant.size === "string" ? variant.size : null);

    return {
        blank:     variant.blank ?? null,
        color:     variant.color?._id ?? null,
        colorName: variant.color?.name ?? variant.ids?.colorName ?? null,
        // Item.size is an ObjectId — only set when we matched a real blank size, else null.
        size:      sizeEntry?._id ?? null,
        sizeName,
        styleCode: blank?.code ?? "",
        designRef: product.design?._id ?? null,
        design:    product.design?.images ?? {},
        name:      product.title ?? sku,
        price:     variant.price ?? null,
    };
}
