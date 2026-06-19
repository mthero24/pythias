// Pure product → card payload. Shared by the storefront app's search/collection grids (lib/catalog.js)
// and the FeaturedProducts section resolver (server.js) so every card has the same shape: main image,
// price, color swatches (name + hex + per-color image), and a back/sleeve "alt view" image.
import { resolveVariantSize } from "./variantSize";

const firstImg = (arr) => (arr || []).find((i) => i && i.image)?.image || null;

export function productCardData(p) {
    const variants = p.variantsArray ?? [];
    const productImages = p.productImages ?? [];
    const prices = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const baseMinCents = prices.length ? Math.round(minPrice * 100) : 0;
    const priceVaries = prices.length > 1 && Math.max(...prices) > minPrice;
    // Pricing: a per-product sale % overrides the blank-level compare-at. Otherwise use any variant whose
    // compare-at beats its price. Either way → struck-through "was" price + savings.
    const salePct = Math.max(0, Math.min(100, Number(p.salePercent) || 0));
    let priceCents = baseMinCents, compareAtCents = 0;
    if (salePct > 0 && baseMinCents > 0) {
        compareAtCents = baseMinCents;
        priceCents = Math.round(baseMinCents * (1 - salePct / 100));
    } else {
        const onSaleVariants = variants.filter((v) => v.price > 0 && v.compareAtPrice > v.price);
        if (onSaleVariants.length) compareAtCents = Math.round(Math.max(...onSaleVariants.map((v) => v.compareAtPrice)) * 100);
    }
    const onSale = compareAtCents > priceCents;
    // "New" for ~30 days after creation.
    const isNew = !!p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 30 * 864e5;
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
    const sizes = [...new Set(variants.map((v) => resolveVariantSize(v, v.blank?.sizes)).filter(Boolean))];
    const categories = [].concat(p.category || []).filter(Boolean);
    const departments = [].concat(p.department || []).filter(Boolean);

    // Default variant for quick-add (first orderable one). Checkout re-prices/validates regardless.
    const v0 = variants.find((v) => v.sku) || variants[0] || {};
    const defaultSku = v0.sku || p.sku || null;
    const defaultColor = v0.color?.name || v0.ids?.colorName || "";
    const defaultSize = (typeof v0.size === "string" ? v0.size : v0.ids?.sizeName) || "";
    const rawDefaultCents = typeof v0.price === "number" && v0.price > 0 ? Math.round(v0.price * 100) : baseMinCents;
    const defaultPriceCents = salePct > 0 ? Math.round(rawDefaultCents * (1 - salePct / 100)) : rawDefaultCents;

    return {
        id: String(p._id),
        slug: p.slug || null,
        sku: p.sku || null,
        title: p.title,
        image: mainImage,
        priceCents,
        priceVaries, onSale, compareAtCents, isNew,
        brand: p.brand || "",
        category: [...categories, ...departments],   // merged (legacy/search)
        categories, departments,
        colors, sizes,
        colorImages: colorImages.slice(0, 12),
        altImage,
        defaultSku, defaultColor, defaultSize, defaultPriceCents,
        // `design` = the artwork (shared across blanks → the dedupe key). `designTemplateId` = the
        // customizer template (often per-product / null), kept only so the buy box knows to customize.
        design: p.design ? String(p.design) : null,
        designTemplateId: p.designTemplateId ? String(p.designTemplateId) : null,
    };
}

// POD catalogs explode: the same artwork sits on a tee + hoodie + tank + long-sleeve, so an unfiltered
// grid shows the same design 6 times. Collapse to ONE representative card per design — keeping the FIRST
// occurrence (so the caller's order, e.g. search relevance or newest, decides which blank represents the
// design). Products with no design (designTemplateId null) are unique items and always pass through.
// Operates on SHAPED cards (productCardData output) so search, catalog, and section grids share one rule.
// Slim entry for the "all styles" modal — serializable (no back-reference to the full card, which would
// make the group circular when passed to a client component).
const styleEntry = (c) => ({
    id: c.id, slug: c.slug, sku: c.sku, title: c.title, image: c.image, priceCents: c.priceCents,
    label: c.categories?.[0] || c.departments?.[0] || c.title,
});

export function dedupeByDesign(cards) {
    const out = [];
    const repByDesign = new Map();   // design -> the representative (first-seen) card
    for (const c of cards || []) {
        const d = c?.design;
        if (d) {
            const rep = repByDesign.get(d);
            if (rep) {                                  // another blank of a design we've already kept
                rep.styleCount = (rep.styleCount || 1) + 1;
                rep.styleProducts.push(styleEntry(c));  // so the card's "styles" modal can list every blank
                continue;
            }
            c.styleCount = 1;
            c.styleProducts = [styleEntry(c)];
            repByDesign.set(d, c);
        }
        out.push(c);
    }
    return out;
}
