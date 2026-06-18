// Pure product → card payload. Shared by the storefront app's search/collection grids (lib/catalog.js)
// and the FeaturedProducts section resolver (server.js) so every card has the same shape: main image,
// price, color swatches (name + hex + per-color image), and a back/sleeve "alt view" image.
const firstImg = (arr) => (arr || []).find((i) => i && i.image)?.image || null;

export function productCardData(p) {
    const variants = p.variantsArray ?? [];
    const productImages = p.productImages ?? [];
    const prices = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const mainImage = firstImg(productImages) || variants.find((v) => v.image)?.image || null;

    // Color swatches — dedupe by name; keep hex (for a colored dot) and a per-color image (to swap to).
    const seen = new Set();
    const colorImages = [];
    for (const v of variants) {
        const name = v.color?.name || v.ids?.colorName;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        colorImages.push({ name, hex: v.color?.hexcode || null, image: v.image || mainImage || null });
    }

    // A different-placement image (back/sleeve) → the "more views" badge.
    const altImage = productImages.find((i) => i.image && i.side && !/front/i.test(String(i.side)) && i.image !== mainImage)?.image || null;

    const colors = [...new Set(variants.map((v) => v.color?.name || v.ids?.colorName).filter(Boolean))];
    const sizes = [...new Set(variants.map((v) => (typeof v.size === "string" ? v.size : v.ids?.sizeName)).filter(Boolean))];
    const categories = [].concat(p.category || []).filter(Boolean);
    const departments = [].concat(p.department || []).filter(Boolean);

    // Default variant for quick-add (first orderable one). Checkout re-prices/validates regardless.
    const v0 = variants.find((v) => v.sku) || variants[0] || {};
    const defaultSku = v0.sku || p.sku || null;
    const defaultColor = v0.color?.name || v0.ids?.colorName || "";
    const defaultSize = (typeof v0.size === "string" ? v0.size : v0.ids?.sizeName) || "";
    const defaultPriceCents = typeof v0.price === "number" && v0.price > 0
        ? Math.round(v0.price * 100)
        : (prices.length ? Math.round(Math.min(...prices) * 100) : 0);

    return {
        id: String(p._id),
        slug: p.slug || null,
        sku: p.sku || null,
        title: p.title,
        image: mainImage,
        priceCents: prices.length ? Math.round(Math.min(...prices) * 100) : 0,
        brand: p.brand || "",
        category: [...categories, ...departments],   // merged (legacy/search)
        categories, departments,
        colors, sizes,
        colorImages: colorImages.slice(0, 12),
        altImage,
        defaultSku, defaultColor, defaultSize, defaultPriceCents,
        designTemplateId: p.designTemplateId ? String(p.designTemplateId) : null,
    };
}
