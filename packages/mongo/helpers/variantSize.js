// Variant size names are inconsistent across the catalog: newer products store the size NAME on the
// variant, older ones store the size subdoc's _id. This resolves a variant to its readable size name,
// preferring (1) an already-readable name on the variant, (2) the denormalized ids.sizeName, then (3) a
// lookup of the id against the blank's sizes ([{ _id, name }]). Pass the relevant blank's sizes (e.g.
// v.blank?.sizes when variantsArray.blank is populated with "sizes").
const isObjectId = (s) => /^[a-f0-9]{24}$/i.test(String(s || ""));

export function resolveVariantSize(v, blankSizes) {
    const raw = typeof v?.size === "string" ? v.size : (v?.size?.name || "");
    if (raw && !isObjectId(raw)) return raw;          // already a readable name
    if (v?.ids?.sizeName) return v.ids.sizeName;      // denormalized name
    const id = isObjectId(raw) ? raw : String(v?.size?._id || v?.size || "");
    const sizes = blankSizes || v?.blank?.sizes || [];
    const found = sizes.find((s) => String(s._id) === id);
    return found?.name || (raw && !isObjectId(raw) ? raw : "");
}
