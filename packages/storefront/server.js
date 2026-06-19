// Server-only: resolves the data each section needs (DB access lives here, not in the
// pure components). Returns an array aligned to `sections` — data[i] is the resolved
// data for sections[i], or null. The public app calls this server-side; the editor
// can call it behind an API route so its preview uses the exact same data shape.
import { PlatformProduct, StorefrontProductStat } from "@pythias/mongo";
import { productCardData, dedupeByDesign } from "./lib/card";

const PRODUCT_SELECT = "title slug sku productImages variantsArray brand category tags design designTemplateId";
// color swatches + blank sizes ([{_id,name}]) so resolveVariantSize maps size _ids → names
const COLOR_POP = [{ path: "variantsArray.color", select: "name hexcode" }, { path: "variantsArray.blank", select: "sizes" }];
const cards = (docs) => (docs || []).map(productCardData);

const minPrice = (p) => {
    const prices = (p.variantsArray || []).map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    return prices.length ? Math.min(...prices) : Infinity;
};

// Featured-products grid. The seller can curate it with an optional search (e.g. "christmas",
// "valentines", "game day") and a sort (featured / newest / best sellers / price).
async function featuredProducts(settings, ctx) {
    const limit = Math.min(Number(settings?.limit) || 8, 24);
    const sort = String(settings?.sort || "featured").toLowerCase();
    const q = String(settings?.query || "").trim();
    // One card per design (POD: same art on tee/hoodie/tank), unless the seller turns it off for this grid.
    const dedupe = settings?.dedupeByDesign !== false;
    const pick = (docs) => (dedupe ? dedupeByDesign(cards(docs)) : cards(docs)).slice(0, limit);
    const span = dedupe ? limit * 4 : limit;   // over-fetch so dedupe still fills `limit` distinct designs

    const base = { orgId: ctx.orgId, active: { $ne: false } };
    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        base.$or = [{ title: rx }, { brand: rx }, { tags: rx }, { category: rx }];
    }

    // Best sellers: rank by purchased units (StorefrontProductStat), then hydrate + keep that order.
    if (sort === "best sellers") {
        const top = await StorefrontProductStat.aggregate([
            { $match: { orgId: ctx.orgId } },
            { $group: { _id: "$productId", units: { $sum: "$purchasedUnits" } } },
            { $sort: { units: -1 } },
            { $limit: 100 },
        ]).catch(() => []);
        const ids = top.map((t) => t._id).filter(Boolean);
        if (ids.length) {
            const found = await PlatformProduct.find({ ...base, _id: { $in: ids } }).populate(COLOR_POP).select(PRODUCT_SELECT).lean();
            const rank = new Map(ids.map((id, i) => [String(id), i]));
            found.sort((a, b) => (rank.get(String(a._id)) ?? 1e9) - (rank.get(String(b._id)) ?? 1e9));
            // top up with newest below (excluding the ones we have) so dedupe can't leave the grid short
            const have = new Set(found.map((p) => String(p._id)));
            const fill = await PlatformProduct.find({ ...base, _id: { $nin: [...have] } })
                .populate(COLOR_POP).select(PRODUCT_SELECT).sort({ _id: -1 }).limit(span).lean();
            return { products: pick([...found, ...fill]) };
        }
    }

    // Price sorts: min variant price isn't a stored field, so rank a capped candidate set in JS.
    if (sort.startsWith("price")) {
        const candidates = await PlatformProduct.find(base).populate(COLOR_POP).select(PRODUCT_SELECT).limit(300).lean();
        const lowFirst = sort.includes("low");
        candidates.sort((a, b) => (lowFirst ? minPrice(a) - minPrice(b) : minPrice(b) - minPrice(a)));
        return { products: pick(candidates) };
    }

    const order = sort === "newest" ? { _id: -1 } : { _id: 1 };
    const products = await PlatformProduct.find(base).populate(COLOR_POP).select(PRODUCT_SELECT).sort(order).limit(span).lean();
    return { products: pick(products) };
}

const RESOLVERS = {
    featuredProducts,
};

export async function resolveSectionData(sections = [], ctx = {}) {
    return Promise.all(
        sections.map(async (s) => {
            const fn = RESOLVERS[s?.type];
            if (!fn) return null;
            try { return await fn(s.settings ?? {}, ctx); }
            catch { return null; }
        })
    );
}
