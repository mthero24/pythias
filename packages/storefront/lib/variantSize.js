// Pure size-name resolver (no deps) — duplicated from @pythias/mongo's helper so the storefront card
// shaper doesn't import the mongo package (which would pull Mongoose into the client bundle via the
// package barrel). Keep the two in sync. Prefers a readable name on the variant, then ids.sizeName, then
// a lookup of the size _id against the blank's sizes ([{ _id, name }]).
const isObjectId = (s) => /^[a-f0-9]{24}$/i.test(String(s || ""));

export function resolveVariantSize(v, blankSizes) {
    const raw = typeof v?.size === "string" ? v.size : (v?.size?.name || "");
    if (raw && !isObjectId(raw)) return raw;
    if (v?.ids?.sizeName) return v.ids.sizeName;
    const id = isObjectId(raw) ? raw : String(v?.size?._id || v?.size || "");
    const sizes = blankSizes || v?.blank?.sizes || [];
    const found = sizes.find((s) => String(s._id) === id);
    return found?.name || (raw && !isObjectId(raw) ? raw : "");
}
