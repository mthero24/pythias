import mongoose from "mongoose";
import { PlatformProduct } from "@pythias/mongo";
import { productCardData, dedupeByDesign } from "@pythias/storefront";

// Card + facet payload for search/collection grids — shared shaper (color swatches + alt views, etc.).
export const shapeProduct = productCardData;

const SELECT = "title slug sku brand productImages variantsArray category department tags design designTemplateId createdAt salePercent";
// name + hex for color swatches; blank sizes ([{_id,name}]) so resolveVariantSize can map size _ids → names
const POP = [{ path: "variantsArray.color", select: "name hexcode" }, { path: "variantsArray.blank", select: "sizes" }];

// Atlas Search index name (create it in Atlas with dynamic mapping — see notes in atlasSearch()).
const ATLAS_INDEX = process.env.SF_ATLAS_SEARCH_INDEX || "products";

// Best-effort Atlas Search. Returns lean+populated docs in relevance order, or null to signal
// "Atlas unavailable, use the fallback" — so search keeps working on a cluster without the index
// (or a non-Atlas dev box). $search must be the first stage and runs over the whole collection, so
// orgId is a `filter` clause; we $project just _ids then hydrate (populate color refs) preserving order.
async function atlasSearch(orgId, term, limit) {
    try {
        const hits = await PlatformProduct.aggregate([
            {
                $search: {
                    index: ATLAS_INDEX,
                    compound: {
                        // orgId is indexed as a token (string) in the Atlas index, so match the string form
                        // (String() handles both an ObjectId instance and an already-string id).
                        filter: [{ equals: { path: "orgId", value: String(orgId) } }],
                        should: [
                            { text: { query: term, path: "title", score: { boost: { value: 5 } } } },
                            { text: { query: term, path: ["brand", "category", "department"], score: { boost: { value: 2 } } } },
                            { text: { query: term, path: "tags" } },
                            // typo tolerance — catches misspellings/partials the exact clauses miss
                            { text: { query: term, path: ["title", "brand", "tags", "category", "department"], fuzzy: { maxEdits: 2, prefixLength: 1 } } },
                        ],
                        minimumShouldMatch: 1,
                    },
                },
            },
            { $match: { active: { $ne: false } } },
            { $limit: limit },
            { $project: { _id: 1 } },
        ]);
        if (!hits) return null;
        const ids = hits.map((h) => h._id);
        if (!ids.length) return [];
        const docs = await PlatformProduct.find({ _id: { $in: ids } }).populate(POP).select(SELECT).lean();
        const byId = new Map(docs.map((d) => [String(d._id), d]));
        return ids.map((id) => byId.get(String(id))).filter(Boolean);   // keep Atlas relevance order
    } catch {
        return null;   // no index / not Atlas / search node down → caller falls back
    }
}

// On-site search. Tries Atlas Search first (typo-tolerant, relevance-ranked); falls back to the Mongo
// text index, then a tolerant regex across title/brand/tags/category for typos/partials. Collapses to
// one card per design by default (`dedupe`) so a POD catalog doesn't repeat the same artwork per blank.
export async function searchProducts(orgId, q, limit = 200, dedupe = true) {
    const base = { orgId, active: { $ne: false } };
    const term = String(q || "").trim();
    const finish = (docs) => {
        const cards = docs.map(shapeProduct);
        return dedupe ? dedupeByDesign(cards) : cards;
    };

    if (!term) {
        // dedupe collapses results, so over-fetch when on so we can still fill `limit` distinct designs
        const all = await PlatformProduct.find(base).populate(POP).select(SELECT).sort({ _id: -1 }).limit(dedupe ? limit * 4 : limit).lean();
        return finish(all).slice(0, limit);
    }

    const atlas = await atlasSearch(orgId, term, dedupe ? limit * 4 : limit);
    if (atlas && atlas.length) return finish(atlas).slice(0, limit);

    let docs = await PlatformProduct.find({ ...base, $text: { $search: term } }, { score: { $meta: "textScore" } })
        .populate(POP).select(SELECT).sort({ score: { $meta: "textScore" } }).limit(limit).lean().catch(() => []);

    if (docs.length < 3) {
        const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const seen = new Set(docs.map((d) => String(d._id)));
        const more = await PlatformProduct.find({ ...base, $or: [{ title: rx }, { brand: rx }, { tags: rx }, { category: rx }] })
            .populate(POP).select(SELECT).limit(limit).lean();
        for (const d of more) if (!seen.has(String(d._id))) docs.push(d);
    }
    return finish(docs).slice(0, limit);
}

// ── Server-side faceted search ─────────────────────────────────────────────────────────────────────
// Filter/count across the WHOLE catalog (not just a page). Atlas provides typo-tolerant text RELEVANCE
// (candidate ids for a term); org-scoping, active filters, sorting and facet COUNTS all run in Mongo
// against the denormalized fields (department/category/brand top-level; color/size/price flattened to
// facetColors/facetSizes/minPriceCents by the product model). Mongo-side filtering means this needs no
// special Atlas index mappings — it works with a plain dynamic index.

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Atlas text-relevance candidate ids for a term (typo tolerant). null = Atlas unavailable (caller uses a
// Mongo regex match instead); [] = Atlas worked but nothing matched the term.
async function atlasTermIds(term, span) {
    if (!term) return null;
    try {
        const hits = await PlatformProduct.aggregate([
            { $search: { index: ATLAS_INDEX, compound: { should: [
                { text: { query: term, path: "title", score: { boost: { value: 5 } } } },
                { text: { query: term, path: ["brand", "category", "department"], score: { boost: { value: 2 } } } },
                { text: { query: term, path: "tags" } },
                { text: { query: term, path: ["title", "brand", "tags", "category", "department"], fuzzy: { maxEdits: 2, prefixLength: 1 } } },
            ], minimumShouldMatch: 1 } } },
            { $limit: span },
            { $project: { _id: 1 } },
        ]);
        return hits.map((h) => h._id);
    } catch { return null; }
}

// Base color vocabulary for query understanding. A base word in the query maps to every catalog color
// that contains it (so "blue" → Royal Blue, Navy Blue, Sky Blue…). gray/grey treated as synonyms.
const BASE_COLORS = ["black", "white", "gray", "grey", "silver", "red", "blue", "navy", "green", "olive", "teal", "mint", "yellow", "gold", "orange", "purple", "lavender", "pink", "brown", "tan", "beige", "cream", "ivory", "maroon", "burgundy", "charcoal", "coral", "khaki", "turquoise"];
// Size synonyms → canonical size. Longer phrases FIRST so "extra large" is matched before "large".
const SIZE_ENTRIES = [["extra small", "XS"], ["x-small", "XS"], ["xs", "XS"], ["extra large", "XL"], ["x-large", "XL"], ["small", "S"], ["sm", "S"], ["medium", "M"], ["med", "M"], ["xxxl", "3XL"], ["3xl", "3XL"], ["xxl", "2XL"], ["2xl", "2XL"], ["xl", "XL"], ["large", "L"], ["lg", "L"]];
// Gender/audience words → the catalog department they map to (resolved against real departments below).
const GENDER_WORDS = [["women", "women"], ["womens", "women"], ["woman", "women"], ["ladies", "women"], ["mens", "men"], ["men", "men"], ["man", "men"], ["kids", "kid"], ["kid", "kid"], ["children", "kid"], ["child", "kid"], ["youth", "youth"], ["boys", "boy"], ["boy", "boy"], ["girls", "girl"], ["girl", "girl"], ["baby", "baby"], ["babies", "baby"], ["toddler", "toddler"], ["unisex", "unisex"]];

// Context-aware query parser: pulls color / size / price / department / category / brand out of a free-text
// query and turns them into filters, leaving the rest as the text term for relevance search. e.g.
// "blue mens fathers day shirt under $25" → { text:"fathers day", colors:[blues], departments:[Men],
// categories:[Shirts], maxPriceCents:2500 }. Everything is matched against the store's REAL catalog
// vocabulary, so we only extract facets that exist (and never filter the results to nothing).
function parseQueryFacets(term, vocab = {}) {
    const { colors = [], sizes = [], departments = [], categories = [], brands = [] } = vocab;
    let text = ` ${String(term).toLowerCase().replace(/\s+/g, " ")} `;
    const cut = (re) => { text = text.replace(re, " "); };
    const word = (w) => new RegExp(`(^| )${esc(w)}( |$)`, "i");
    const wordG = (w) => new RegExp(`(^| )${esc(w)}( |$)`, "gi");

    const r = { colors: new Set(), sizes: new Set(), departments: new Set(), categories: new Set(), brands: new Set(), maxPriceCents: 0 };

    // Price: "under/below/less than/up to $X".
    const pm = text.match(/\b(?:under|below|less than|cheaper than|up to|max)\s*\$?\s*(\d+(?:\.\d+)?)\b/i);
    if (pm) { r.maxPriceCents = Math.round(parseFloat(pm[1]) * 100); cut(new RegExp(esc(pm[0]), "i")); }

    // Colors — base word → catalog colors containing it.
    const knownC = colors.map((c) => ({ raw: c, lc: String(c).toLowerCase() }));
    for (const base of BASE_COLORS) {
        if (!word(base).test(text)) continue;
        const isGrey = base === "gray" || base === "grey";
        const matched = knownC.filter((c) => c.lc.includes(base) || (isGrey && (c.lc.includes("gray") || c.lc.includes("grey"))));
        if (!matched.length) continue;
        matched.forEach((c) => r.colors.add(c.raw));
        cut(wordG(base));
    }

    // Sizes — synonym → canonical, only if that size exists in the catalog.
    const sizeByCanon = new Map(sizes.map((s) => [String(s).toUpperCase(), s]));
    for (const [w, canon] of SIZE_ENTRIES) {
        if (sizeByCanon.has(canon) && word(w).test(text)) { r.sizes.add(sizeByCanon.get(canon)); cut(wordG(w)); }
    }

    // Departments / categories / brands — match the store's real values (whole word/phrase, simple plural).
    const matchVocab = (values, bucket) => {
        for (const v of values) {
            const lc = String(v).toLowerCase().trim();
            if (lc.length < 3) continue;
            for (const variant of [lc, lc.replace(/s$/, ""), `${lc}s`]) {
                if (variant.length < 3) continue;
                if (word(variant).test(text)) { bucket.add(v); cut(wordG(variant)); break; }
            }
        }
    };
    matchVocab(departments, r.departments);
    matchVocab(categories, r.categories);
    matchVocab(brands, r.brands);

    // Gender/audience words → a department, if the catalog has a matching one (avoid men⊂women).
    for (const [w, root] of GENDER_WORDS) {
        if (!word(w).test(text)) continue;
        const dep = departments.find((d) => {
            const dl = String(d).toLowerCase();
            return root === "men" ? /(^|[^o])\bmen('?s)?\b/.test(dl) && !dl.includes("women") : dl.includes(root);
        });
        if (dep) { r.departments.add(dep); cut(wordG(w)); }
    }

    return {
        text: text.replace(/\s+/g, " ").trim(),
        colors: [...r.colors], sizes: [...r.sizes],
        departments: [...r.departments], categories: [...r.categories], brands: [...r.brands],
        maxPriceCents: r.maxPriceCents,
    };
}

// Faceted search → { products (shaped + deduped), facets }. facets = { departments, categories, colors,
// sizes, brands } each [{ value, count }], scoped to org (+ term) but NOT narrowed by the active
// selections, so multi-select within a facet stays usable.
export async function searchProductsFaceted(orgId, { q, filters = {}, sort = "featured", limit = 200, dedupe = true } = {}) {
    let term = String(q || "").trim();
    const span = dedupe ? limit * 6 : limit * 2;   // over-fetch — dedupe + JS sort happen after
    const oid = mongoose.Types.ObjectId.isValid(orgId) ? new mongoose.Types.ObjectId(orgId) : orgId;

    // Context-aware query understanding: lift color/size/price/department/category/brand out of the free
    // text and apply them as filters (so they're not phrase-matched). Only facets the catalog actually
    // has are extracted. Explicit UI selections win — parsed facets fill the gaps.
    const F = { ...filters };
    if (term) {
        const base = { orgId: oid, active: { $ne: false } };
        const [colors, sizes, departments, categories, brands] = await Promise.all([
            PlatformProduct.distinct("facetColors", base), PlatformProduct.distinct("facetSizes", base),
            PlatformProduct.distinct("department", base), PlatformProduct.distinct("category", base),
            PlatformProduct.distinct("brand", base),
        ]);
        const p = parseQueryFacets(term, { colors, sizes, departments, categories, brands });
        term = p.text;
        if (!F.colors?.length && p.colors.length) F.colors = p.colors;
        if (!F.sizes?.length && p.sizes.length) F.sizes = p.sizes;
        if (!F.departments?.length && p.departments.length) F.departments = p.departments;
        if (!F.categories?.length && p.categories.length) F.categories = p.categories;
        if (!F.brands?.length && p.brands.length) F.brands = p.brands;
        if (!F.maxPriceCents && p.maxPriceCents) F.maxPriceCents = p.maxPriceCents;
    }

    // Term relevance: Atlas ids when available, else a tolerant Mongo regex.
    const atlasIds = await atlasTermIds(term, span * 2);
    const termRegex = term && atlasIds === null ? new RegExp(esc(term), "i") : null;
    const termClause = (m) => {
        if (!term) return m;
        if (atlasIds === null) return { ...m, $or: [{ title: termRegex }, { brand: termRegex }, { tags: termRegex }, { category: termRegex }, { department: termRegex }] };
        return { ...m, _id: { $in: atlasIds } };
    };

    // Org scope + active facet selections (color/size/price use the denormalized facet fields).
    const cond = termClause({ orgId: oid, active: { $ne: false } });
    if (F.departments?.length) cond.department  = { $in: F.departments };
    if (F.categories?.length)  cond.category    = { $in: F.categories };
    if (F.colors?.length)      cond.facetColors = { $in: F.colors };
    if (F.sizes?.length)       cond.facetSizes  = { $in: F.sizes };
    if (F.brands?.length)      cond.brand       = { $in: F.brands };
    if (F.maxPriceCents)       cond.minPriceCents = { $lte: Number(F.maxPriceCents) };

    let docs = await PlatformProduct.find(cond).populate(POP).select(SELECT).limit(span).lean();
    // Order: Atlas relevance when we have ids; otherwise newest. price/title re-sort happens on cards below.
    if (term && atlasIds && atlasIds.length) {
        const rank = new Map(atlasIds.map((id, i) => [String(id), i]));
        docs.sort((a, b) => (rank.get(String(a._id)) ?? 1e9) - (rank.get(String(b._id)) ?? 1e9));
    } else {
        docs.sort((a, b) => String(b._id).localeCompare(String(a._id)));
    }
    let cards = docs.map(shapeProduct);
    if (sort === "price-asc") cards.sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "price-desc") cards.sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "title") cards.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    const products = (dedupe ? dedupeByDesign(cards) : cards).slice(0, limit);

    // Facet counts — Mongo aggregation scoped to org (+ term), independent of the active selections. Uses
    // the denormalized facet fields (facetColors/facetSizes empty until the backfill runs).
    let facets = null;
    try {
        const fmatch = termClause({ orgId: oid, active: { $ne: false } });
        const unwindGrp = (path) => [{ $unwind: `$${path}` }, { $group: { _id: `$${path}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }];
        const fieldGrp = (path) => [{ $match: { [path]: { $nin: [null, ""] } } }, { $group: { _id: `$${path}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }];
        const agg = await PlatformProduct.aggregate([
            { $match: fmatch },
            { $facet: {
                departments: unwindGrp("department"),
                categories:  unwindGrp("category"),
                colors:      unwindGrp("facetColors"),
                sizes:       unwindGrp("facetSizes"),
                brands:      fieldGrp("brand"),
            } },
        ]);
        const m = (arr) => (arr || []).filter((b) => b._id != null && b._id !== "").map((b) => ({ value: b._id, count: b.count }));
        const f = agg?.[0] || {};
        facets = { departments: m(f.departments), categories: m(f.categories), colors: m(f.colors), sizes: m(f.sizes), brands: m(f.brands) };
    } catch { facets = null; }

    // Top product tags across the CURRENT (filtered) result set — for the clickable "related searches" bar.
    let tags = [];
    try {
        const tagAgg = await PlatformProduct.aggregate([
            { $match: cond },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 24 },
        ]);
        tags = tagAgg.map((t) => t._id).filter((t) => t != null && String(t).trim() !== "");
    } catch { tags = []; }

    return { products, facets, tags };
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
