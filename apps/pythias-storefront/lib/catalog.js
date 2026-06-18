import mongoose from "mongoose";
import { PlatformProduct } from "@pythias/mongo";
import { productCardData } from "@pythias/storefront";

// Card + facet payload for search/collection grids — shared shaper (color swatches + alt views, etc.).
export const shapeProduct = productCardData;

const SELECT = "title slug sku brand productImages variantsArray category department tags designTemplateId";
const POP = { path: "variantsArray.color", select: "name hexcode" };   // name + hex for color swatches

// On-site search: Mongo text index first; if thin, fall back to a tolerant regex across
// title/brand/tags/category (covers typos/partials the text index misses).
export async function searchProducts(orgId, q, limit = 200) {
    const base = { orgId, active: { $ne: false } };
    const term = String(q || "").trim();
    if (!term) {
        const all = await PlatformProduct.find(base).populate(POP).select(SELECT).sort({ _id: -1 }).limit(limit).lean();
        return all.map(shapeProduct);
    }

    let docs = await PlatformProduct.find({ ...base, $text: { $search: term } }, { score: { $meta: "textScore" } })
        .populate(POP).select(SELECT).sort({ score: { $meta: "textScore" } }).limit(limit).lean().catch(() => []);

    if (docs.length < 3) {
        const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const seen = new Set(docs.map((d) => String(d._id)));
        const more = await PlatformProduct.find({ ...base, $or: [{ title: rx }, { brand: rx }, { tags: rx }, { category: rx }] })
            .populate(POP).select(SELECT).limit(limit).lean();
        for (const d of more) if (!seen.has(String(d._id))) docs.push(d);
    }
    return docs.map(shapeProduct);
}

// Resolve a collection's products. Manual = the picked ids (order preserved). Smart = match
// the rules (text conditions in Mongo; price filtered after shaping since price is per-variant).
export async function resolveCollectionProducts(orgId, collection, limit = 300) {
    const base = { orgId, active: { $ne: false } };

    if (collection.type === "manual") {
        const ids = (collection.productIds || []).map((id) => new mongoose.Types.ObjectId(id));
        if (!ids.length) return [];
        const docs = await PlatformProduct.find({ ...base, _id: { $in: ids } }).populate(POP).select(SELECT).lean();
        const byId = Object.fromEntries(docs.map((d) => [String(d._id), d]));
        return (collection.productIds || []).map((id) => byId[String(id)]).filter(Boolean).map(shapeProduct);
    }

    const conds = collection.rules?.conditions || [];
    const rx = (v) => new RegExp(String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const mongoClauses = [];
    let priceFilter = null;
    for (const c of conds) {
        if (c.field === "priceCents") { priceFilter = priceFilter || []; priceFilter.push(c); continue; }
        if (c.field === "tag") mongoClauses.push({ tags: rx(c.value) });
        else if (c.field === "category") mongoClauses.push({ $or: [{ category: rx(c.value) }, { department: rx(c.value) }] });
        else if (c.field === "brand") mongoClauses.push({ brand: rx(c.value) });
        else if (c.field === "title") mongoClauses.push({ title: rx(c.value) });
    }
    const query = { ...base };
    if (mongoClauses.length) query[(collection.rules?.match === "any") ? "$or" : "$and"] = mongoClauses;

    let docs = await PlatformProduct.find(query).populate(POP).select(SELECT).limit(limit).lean();
    let shaped = docs.map(shapeProduct);
    if (priceFilter) {
        for (const c of priceFilter) {
            const val = Number(c.value) || 0;
            shaped = shaped.filter((p) => (c.op === "lte" ? p.priceCents <= val : c.op === "gte" ? p.priceCents >= val : true));
        }
    }
    if (collection.sort === "price-asc") shaped.sort((a, b) => a.priceCents - b.priceCents);
    else if (collection.sort === "price-desc") shaped.sort((a, b) => b.priceCents - a.priceCents);
    else if (collection.sort === "title") shaped.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return shaped;
}
