// Warm the browser (and images-app) cache for a set of image URLs during idle time, so a later
// <img>/canvas load — e.g. clicking a color swatch — renders instantly instead of fetching then.
//
// Designed to NOT slow the page: the work is deferred to requestIdleCallback (with a timeout
// fallback), and images download at low priority via detached Image() objects. De-duped, and it
// remembers what it already warmed this session so repeat calls are cheap.
const warmed = typeof window !== "undefined" ? new Set() : null;

export function prefetchImages(urls) {
    if (typeof window === "undefined" || !warmed) return;
    const list = [...new Set((urls || []).filter((u) => typeof u === "string" && u && !warmed.has(u)))];
    if (!list.length) return;
    const run = () => {
        for (const url of list) {
            warmed.add(url);
            const img = new Image();
            try { img.decoding = "async"; img.fetchPriority = "low"; } catch { /* older browsers */ }
            img.src = url;
        }
    };
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 2000 });
    else setTimeout(run, 300);
}
