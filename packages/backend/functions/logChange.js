import { ChangeLog } from "@pythias/mongo";

// All fields to diff per entity type
const TRACKED = {
    blank: [
        "name", "code", "type", "brand", "active", "description",
        "department", "subcategory", "vendor", "retailPrice",
        "category", "suppliers", "tags", "searchTagKeywords", "printTypes",
        "printOnBack", "tearawayLabel", "isHeavyShipping", "onlyAvailableForBulk", "hasExtra",
        "colors", "sizes", "bulletPoints", "printLocations", "images",
        "envelopes", "fold",
    ],
    design: [
        "name", "sku", "description", "tags", "sendToMarketplaces",
        "printType", "gender", "season", "published", "blanks",
        "isLicenseDesign", "licenseHolder",
    ],
    product: [
        "name", "sku", "title", "brand", "productDescription",
        "description", "price", "gender", "season",
    ],
    inventory: ["quantity"],   // blank stock — records quantity before→after (e.g. return-to-queue / return-to-inventory)
};

// Field-specific serializers — consistent whether data is populated or just ObjectIds
const FIELD_SERIALIZERS = {
    // Blank fields
    colors:         (arr) => refArray(arr, v => v?.name || v?.code),
    sizes:          (arr) => (arr || []).map(s => `${s.name}(w:${s.weight ?? 0},c:${s.cost ?? 0},r:${s.retailPrice ?? 0},b:${s.basePrice ?? 0})`).sort().join(" | "),
    bulletPoints:   (arr) => (arr || []).map(b => `${b.title || ""}:${b.description || ""}`).sort().join(" | "),
    printLocations: (arr) => refArray(arr, v => v?.name),
    images:         (arr) => (arr || []).map(i => `${i.url || i.image || ""}:${i.color || ""}`).sort().join(" | "),
    envelopes:      (arr) => (arr || []).map(e => `${e.sizeName}:${e.placement}(platen:${e.platen},w:${e.width},h:${e.height},v:${e.vertoffset},ho:${e.horizoffset})`).sort().join(" | "),
    fold:           (arr) => (arr || []).map(f => `${f.sizeName}(${f.fold},sl:${f.sleeves},bd:${f.body})`).sort().join(" | "),
    category:       (arr) => strArray(arr),
    suppliers:      (arr) => strArray(arr),
    tags:           (arr) => strArray(arr),
    searchTagKeywords: (arr) => strArray(arr),
    printTypes:     (arr) => strArray(arr),
    // Design fields
    blanks: (arr) => (arr || []).map(b => {
        const code = b?.blank?.code || b?.blank?.name || String(b?.blank?._id || b?.blank || "");
        const colors = refArray(b?.colors, v => v?.name || v?.code);
        return `${code}[${colors}]`;
    }).sort().join(" | "),
};

function refArray(arr, nameGetter) {
    return (arr || []).map(v => {
        if (!v) return "";
        const named = nameGetter(v);
        return named || String(v?._id || v);
    }).sort().join(", ");
}

function strArray(arr) {
    return (arr || []).map(v => String(v ?? "")).sort().join(", ");
}

function toStr(field, val) {
    if (val === null || val === undefined) return "";
    const s = FIELD_SERIALIZERS[field];
    if (s) return s(val);
    if (Array.isArray(val)) return val.map(v => {
        if (!v || typeof v !== "object") return String(v ?? "");
        return v.name || v.code || v.sku || v.title || String(v._id || v);
    }).sort().join(", ");
    if (val && typeof val === "object") return val.name || val.code || val.sku || val.title || JSON.stringify(val);
    return String(val);
}

// Compact print-box formatter for the change log, e.g. "(x:120, y:110, w:160, h:200, r:15)".
const boxFmt = (b) => b
    ? `(x:${Math.round(b.x ?? 0)}, y:${Math.round(b.y ?? 0)}, w:${Math.round(b.width ?? 0)}, h:${Math.round(b.height ?? 0)}${b.rotation ? `, r:${Math.round(b.rotation)}` : ""})`
    : "—";
const imgLabel = (img) => ((img?.image || img?.url || "").split("/").pop()?.split("?")[0]) || "image";

// Granular image diff: one row per print-box that moved (so the log shows HOW boxes changed, not just
// "image edited"), plus added/removed images. Images are matched by their URL (+color).
function diffImages(beforeArr = [], afterArr = []) {
    const rows = [];
    const key = (img) => `${img?.image || img?.url || ""}|${img?.color || ""}`;
    const bMap = new Map((beforeArr || []).map((i) => [key(i), i]));
    const aMap = new Map((afterArr || []).map((i) => [key(i), i]));
    for (const [k, aImg] of aMap) {
        const bImg = bMap.get(k);
        const label = imgLabel(aImg);
        if (!bImg) { rows.push({ field: `image ${label}`, before: "—", after: "added" }); continue; }
        const locs = new Set([...Object.keys(bImg.boxes || {}), ...Object.keys(aImg.boxes || {})]);
        for (const loc of [...locs].sort()) {
            const bs = boxFmt(bImg.boxes?.[loc]);
            const as = boxFmt(aImg.boxes?.[loc]);
            if (bs !== as) rows.push({ field: `${label} · ${loc} box`, before: bs, after: as });
        }
    }
    for (const [k, bImg] of bMap) {
        if (!aMap.has(k)) rows.push({ field: `image ${imgLabel(bImg)}`, before: "removed", after: "—" });
    }
    return rows;
}

function diffDocs(entityType, rawBefore, rawAfter) {
    const before = rawBefore?.toObject ? rawBefore.toObject() : rawBefore;
    const after  = rawAfter?.toObject  ? rawAfter.toObject()  : rawAfter;
    const rows = [];
    for (const field of (TRACKED[entityType] || [])) {
        if (field === "images" && (Array.isArray(before?.images) || Array.isArray(after?.images))) {
            rows.push(...diffImages(before?.images, after?.images));   // per-box granularity
            continue;
        }
        const b = toStr(field, before?.[field]);
        const a = toStr(field, after?.[field]);
        if (b !== a) rows.push({ field, before: b, after: a });
    }
    return rows;
}

export async function logChange({ entityType, entityId, entityName, action, before, after, userName, email, provider = "premierPrinting" }) {
    try {
        // Diff whenever we have both snapshots — not just action "update" — so image/box edits, which
        // use action "blank_image_edit", still record exactly what changed.
        const changes = (before && after) ? diffDocs(entityType, before, after) : [];
        console.log(`[logChange] ${action} ${entityType} "${entityName}" by ${userName} — ${changes.length} field(s) changed`, changes.map(c => c.field));
        await ChangeLog.create({
            entityType,
            entityId:   String(entityId || ""),
            entityName: entityName || "",
            action,
            userName:   userName || "",
            email:      email || "",
            provider,
            changes,
        });
    } catch (e) {
        console.error("[logChange] error:", e.message, { entityType, action, provider });
    }
}
