import { PlatformProduct } from "@pythias/mongo";
import { searchProducts } from "@/lib/catalog";

// Resolve a generic card-item shape { title, image, price, url } for email product blocks.
const money = (cents) => (typeof cents === "number" && cents > 0 ? `$${(cents / 100).toFixed(2)}` : "");
const abs = (img, baseUrl) => (img && !/^https?:/i.test(img) && baseUrl ? `${baseUrl}${img}` : (img || ""));

// Pick catalog products for an email block. With a query, use the SAME Atlas-powered catalog search the
// storefront uses (typo-tolerant, relevance-ranked, deduped by design) → much better than a plain regex.
// With explicit ids, fetch those directly. Empty query → newest products (searchProducts fallback).
export async function resolveProducts(orgId, { query = "", ids = [], limit = 3, baseUrl = "" } = {}) {
    if (Array.isArray(ids) && ids.length) {
        const docs = await PlatformProduct.find({ orgId, _id: { $in: ids } })
            .select("title slug productImages variantsArray").limit(limit).lean().catch(() => []);
        return docs.map((p) => {
            const image = (p.productImages || []).map((pi) => pi?.image).find(Boolean) || "";
            const prices = (p.variantsArray || []).map((v) => v?.price).filter((n) => typeof n === "number" && n > 0);
            const minCents = prices.length ? Math.round(Math.min(...prices) * 100) : 0;
            return { title: p.title || "", image: abs(image, baseUrl), price: money(minCents), url: baseUrl ? `${baseUrl}/products/${p.slug || p._id}` : "" };
        });
    }
    const cards = await searchProducts(orgId, query, limit).catch(() => []);
    return cards.map((c) => ({
        title: c.title || "",
        image: abs(c.image, baseUrl),
        price: money(c.priceCents || 0) + (c.priceVaries ? "+" : ""),
        url: baseUrl ? `${baseUrl}/products/${c.slug || c.id}` : "",
    }));
}

// Resolve every dynamic block in a campaign/flow block array (attach .items) before rendering.
// `ctx` carries per-order data for post-purchase flow blocks (order_summary / review_buttons).
export async function resolveCampaignBlocks(orgId, blocks = [], baseUrl = "", ctx = null) {
    if (!Array.isArray(blocks)) return [];
    return Promise.all(blocks.map(async (b) => {
        if (b?.type === "products") {
            const items = await resolveProducts(orgId, { query: b.query, ids: b.productIds, limit: b.limit || 3, baseUrl });
            return { ...b, items };
        }
        // Post-purchase: this order's line items as product cards.
        if (b?.type === "order_summary") return { ...b, items: ctx?.items || [] };
        // Post-purchase: a "Leave a review" button per product in this order.
        if (b?.type === "review_buttons") {
            const products = (ctx?.reviewProducts || []).map((p) => ({ ...p, url: baseUrl ? `${baseUrl}/products/${p.id}#review` : "#" }));
            return { ...b, products };
        }
        return b;
    }));
}
