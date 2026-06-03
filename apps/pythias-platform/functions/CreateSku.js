"use client";

const DEFAULT_PARTS = ["blank.code", "color.sku", "size.sku", "design.sku"];
const DEFAULT_SEP = "_";

let _cachedFormat = null;

const getFormat = async () => {
    if (_cachedFormat) return _cachedFormat;
    try {
        const res = await fetch("/api/admin/settings/sku");
        const data = await res.json();
        if (!data.error && data.format) {
            _cachedFormat = data.format;
            return _cachedFormat;
        }
    } catch {}
    _cachedFormat = { parts: DEFAULT_PARTS, separator: DEFAULT_SEP };
    return _cachedFormat;
};

const resolvePart = (part, { blank, color, size, design, threadColor }) => {
    switch (part) {
        case "blank.code":  return blank?.code ?? "";
        case "design.sku":  return design?.sku ?? "";
        case "color.sku":   return color?.sku ?? color?.name?.toLowerCase().replace(/\s+/g, "") ?? "";
        case "size.sku":    return size?.sku ?? size?.name ?? "";
        default:            return "";
    }
};

export const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    const format = await getFormat();
    const parts = (format.parts ?? DEFAULT_PARTS)
        .map(p => resolvePart(p, { blank, color, size, design, threadColor }))
        .filter(Boolean);
    if (threadColor) parts.push(threadColor);
    return parts.join(format.separator ?? DEFAULT_SEP);
};

// Call this when the org format changes so the cache is refreshed
export const invalidateSkuFormatCache = () => { _cachedFormat = null; };
