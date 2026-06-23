// UPC / barcode product lookup for "buy-not-build" reseller catalog products.
// Strategy (per product decision): UPCitemdb first (fast, structured), then Claude web_search to
// fill gaps (richer description / variants / images). Returns a normalized product shape the
// create-product UI prefills; the seller can edit everything before saving.

const UPCITEMDB_TRIAL = "https://api.upcitemdb.com/prod/trial/lookup";
const UPCITEMDB_PAID  = "https://api.upcitemdb.com/prod/v1/lookup";

const normalizeUpc = (upc) => String(upc || "").replace(/[^0-9]/g, "");

// Structured lookup from the UPC database. Trial endpoint needs no key (rate-limited); a paid
// key (UPCITEMDB_KEY) lifts the limits.
async function fromUpcItemDb(upc) {
    const key = process.env.UPCITEMDB_KEY;
    const url = `${key ? UPCITEMDB_PAID : UPCITEMDB_TRIAL}?upc=${encodeURIComponent(upc)}`;
    const headers = key ? { user_key: key, key_type: "3scale" } : {};
    const res = await fetch(url, { headers }).catch(() => null);
    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    const item = data?.items?.[0];
    if (!item) return null;
    return {
        title: item.title || "",
        brand: item.brand || "",
        description: item.description || "",
        category: item.category || "",
        images: Array.isArray(item.images) ? item.images.filter((u) => /^https?:/i.test(u)).slice(0, 6) : [],
        variants: [],
    };
}

// Web research fallback via Claude's server-side web_search tool. Used only when the UPC DB is
// missing or sparse, to keep web-search billing minimal.
async function fromWebSearch(upc, hint = {}) {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; } catch { return null; }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const ask = `Find the retail product with UPC/barcode ${upc}${hint.title ? ` (it may be "${hint.title}")` : ""}. Search the web. `
        + `Return STRICT JSON only (no prose, no code fences): {"found":true|false,"title":"","brand":"","description":"a 2-4 sentence selling description","category":"","images":["direct https image URLs, up to 4"],"variants":[{"name":"e.g. a size or color option","sku":"","price":0}]}. `
        + `Only include real information you actually found; use "" or [] when unknown. Set found:false if you cannot identify the product.`;
    const msg = await client.messages.create({
        model: process.env.CONTENT_AI_MODEL || "claude-opus-4-8",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        messages: [{ role: "user", content: ask }],
    }).catch((e) => { console.error("[upcLookup] web_search failed:", e?.message); return null; });
    if (!msg) return null;
    const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    let parsed; try { parsed = JSON.parse(m[0]); } catch { return null; }
    if (parsed.found === false) return null;
    return {
        title: parsed.title || "",
        brand: parsed.brand || "",
        description: parsed.description || "",
        category: parsed.category || "",
        images: Array.isArray(parsed.images) ? parsed.images.filter((u) => /^https?:/i.test(u)).slice(0, 6) : [],
        variants: Array.isArray(parsed.variants) ? parsed.variants.slice(0, 20).map((v) => ({ name: v.name || "", sku: v.sku || "", price: Number(v.price) || 0 })) : [],
    };
}

// Public: look up a UPC and return { found, upc, source, product:{title,brand,description,category,images[],variants[]} }.
export async function lookupUpc(rawUpc) {
    const upc = normalizeUpc(rawUpc);
    if (upc.length < 6) return { found: false, error: "Enter a valid UPC / barcode (digits only)." };

    const db = await fromUpcItemDb(upc);
    const sparse = !db || (!db.description && (!db.images || db.images.length === 0));
    const ai = sparse ? await fromWebSearch(upc, { title: db?.title }) : null;

    const product = {
        title:       db?.title || ai?.title || "",
        brand:       db?.brand || ai?.brand || "",
        description: db?.description || ai?.description || "",
        category:    db?.category || ai?.category || "",
        images:      (db?.images?.length ? db.images : ai?.images) || [],
        variants:    (ai?.variants?.length ? ai.variants : db?.variants) || [],
    };
    const found = !!(product.title || product.images.length);
    return { found, upc, source: db && ai ? "upcitemdb+ai" : db ? "upcitemdb" : ai ? "ai" : "none", product };
}
