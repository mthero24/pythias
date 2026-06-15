// Small helpers for analytics ingest.

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

export function deviceFromUA(ua = "") {
    const s = ua.toLowerCase();
    if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
    if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(s)) return "mobile";
    return "desktop";
}

export function domainOf(referrer = "") {
    try { return referrer ? new URL(referrer).hostname.replace(/^www\./, "") : ""; }
    catch { return ""; }
}

// Normalize a path: pathname only, no query/hash, trimmed, capped.
export function cleanPath(p = "/") {
    let path = String(p || "/");
    const q = path.search(/[?#]/);
    if (q >= 0) path = path.slice(0, q);
    if (!path.startsWith("/")) path = "/" + path;
    return path.slice(0, 300) || "/";
}
