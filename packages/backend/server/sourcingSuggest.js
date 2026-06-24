// AI on-hand suggestions (Phase 3, step 4). Analyzes recent sales velocity for a catalog product's
// variants (from PlatformItem) and suggests a reorder point + restock-to level per variant. A
// deterministic velocity model is the baseline; Claude refines it (trend-aware) when available.

import { PlatformProduct, PlatformItem } from "@pythias/mongo";

const DAY = 864e5;
const LEAD_DAYS = Number(process.env.CATALOG_LEAD_DAYS) || 12;  // ~CJ fulfillment + ship time
const SAFETY_DAYS = 7;
const TARGET_DAYS = 45;                                          // restock-to ≈ 6 weeks of supply

// Velocity-based fallback when AI is unavailable.
function deterministic(perDay) {
    if (perDay <= 0) return { reorderPoint: 0, restockTo: 0, reason: "No recent sales — no reorder suggested." };
    const rp = Math.max(1, Math.ceil(perDay * (LEAD_DAYS + SAFETY_DAYS)));
    const rt = Math.max(rp + Math.ceil(perDay * 7), Math.ceil(perDay * TARGET_DAYS));
    return { reorderPoint: rp, restockTo: rt, reason: `~${perDay.toFixed(2)}/day — covers the ${LEAD_DAYS}-day lead time plus a buffer.` };
}

async function aiSuggest(title, rows) {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; } catch { return null; }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const data = rows.map((r) => ({ sku: r.sku, name: r.name, onHand: r.stock, sold_last_90d: r.total90, sold_last_30d: r.sold30, sold_last_7d: r.sold7, est_per_day: r.perDay }));
    const ask = `You are an inventory planner for an e-commerce seller. Supplier lead time is about ${LEAD_DAYS} days. `
        + `For the product "${title}", here are per-variant sales stats over the last 90 days:\n${JSON.stringify(data)}\n\n`
        + `For each SKU, suggest "reorderPoint" (the on-hand level that should trigger a restock — roughly lead-time demand plus a safety buffer) and "restockTo" (the target on-hand right after restocking, about 3-6 weeks of supply). `
        + `Weight recent velocity (7- and 30-day) more heavily than older sales. If a variant has little or no sales, keep the levels low or 0. Use practical whole units. `
        + `Return STRICT JSON only — no prose, no code fences: [{"sku":"","reorderPoint":0,"restockTo":0,"reason":"one short sentence"}].`;
    const msg = await client.messages.create({
        model: process.env.CONTENT_AI_MODEL || "claude-opus-4-8",
        max_tokens: 1200,
        messages: [{ role: "user", content: ask }],
    }).catch((e) => { console.error("[sourcingSuggest] ai failed:", e?.message); return null; });
    if (!msg) return null;
    const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return null;
    try { const arr = JSON.parse(m[0]); return Array.isArray(arr) ? arr : null; } catch { return null; }
}

export async function suggestReorderLevels(orgId, productId) {
    const p = await PlatformProduct.findOne({ _id: productId, orgId, isCatalogProduct: true }).select("title variantsArray").lean();
    if (!p) return { ok: false, error: "Product not found." };
    const variants = (p.variantsArray || []).filter((v) => v.sku);
    const skus = variants.map((v) => v.sku);
    if (!skus.length) return { ok: false, error: "No variants to analyze." };

    const now = Date.now();
    const items = await PlatformItem.find({ orgId, sku: { $in: skus }, canceled: { $ne: true }, date: { $gte: new Date(now - 90 * DAY) } })
        .select("sku quantity date").lean();

    const stat = {};
    for (const s of skus) stat[s] = { total90: 0, sold30: 0, sold7: 0, firstSale: null };
    for (const it of items) {
        const st = stat[it.sku]; if (!st) continue;
        const qty = Number(it.quantity) || 1;
        const t = new Date(it.date).getTime();
        st.total90 += qty;
        if (t >= now - 30 * DAY) st.sold30 += qty;
        if (t >= now - 7 * DAY) st.sold7 += qty;
        if (!st.firstSale || t < st.firstSale) st.firstSale = t;
    }

    const rows = variants.map((v) => {
        const st = stat[v.sku];
        const observedDays = st.firstSale ? Math.max(7, Math.min(90, (now - st.firstSale) / DAY)) : 90;
        // Recent-weighted daily velocity: prefer the last 30 days when there's recent activity.
        const perDay = st.sold30 > 0 ? st.sold30 / 30 : st.total90 / observedDays;
        return {
            sku: v.sku, name: v.name || "", stock: Number(v.stock) || 0,
            reorderPoint: Number(v.reorderPoint) || 0, reorderTo: Number(v.reorderTo) || 0,
            total90: st.total90, sold30: st.sold30, sold7: st.sold7, perDay: Number(perDay.toFixed(3)),
        };
    });

    const baseline = {};
    rows.forEach((r) => { baseline[r.sku] = deterministic(r.perDay); });
    const ai = await aiSuggest(p.title, rows);
    const bySku = {};
    if (Array.isArray(ai)) ai.forEach((s) => { if (s?.sku) bySku[s.sku] = s; });

    return {
        ok: true,
        aiUsed: !!ai,
        suggestions: rows.map((r) => {
            const s = bySku[r.sku] || baseline[r.sku];
            return {
                sku: r.sku, name: r.name, stock: r.stock,
                currentReorderPoint: r.reorderPoint, currentReorderTo: r.reorderTo,
                reorderPoint: Math.max(0, Math.round(Number(s.reorderPoint)) || 0),
                restockTo: Math.max(0, Math.round(Number(s.restockTo)) || 0),
                perDay: r.perDay, sold30: r.sold30, sold90: r.total90,
                reason: s.reason || baseline[r.sku].reason,
            };
        }),
    };
}
