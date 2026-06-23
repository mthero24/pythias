import { PlatformProduct } from "@pythias/mongo";

// Resolve a generic card-item shape { title, image, price, url } for email product blocks.
const money = (n) => (typeof n === "number" && n > 0 ? `$${n.toFixed(2)}` : "");

function toItem(p, baseUrl) {
    const image = (p.productImages || []).map((pi) => pi?.image).find(Boolean) || "";
    const prices = (p.variantsArray || []).map((v) => v?.price).filter((n) => typeof n === "number" && n > 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const slug = p.slug || p._id?.toString();
    return {
        title: p.title || "",
        image: image && !image.startsWith("http") && baseUrl ? `${baseUrl}${image}` : image,
        price: money(min),
        url: baseUrl && slug ? `${baseUrl}/products/${slug}` : "",
    };
}

// Context product search: pick catalog products RELEVANT to a query (title/tags/category), org-scoped.
// Falls back to newest products when no query. Used by the email builder's "products" block.
export async function resolveProducts(orgId, { query = "", ids = [], limit = 3, baseUrl = "" } = {}) {
    const sel = "title slug productImages variantsArray";
    let docs = [];
    if (Array.isArray(ids) && ids.length) {
        docs = await PlatformProduct.find({ orgId, _id: { $in: ids } }).select(sel).limit(limit).lean().catch(() => []);
    } else if (query && query.trim()) {
        const rx = new RegExp(query.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
        docs = await PlatformProduct.find({ orgId, active: { $ne: false }, "productImages.0": { $exists: true }, $or: [{ title: rx }, { tags: rx }, { category: rx }] })
            .select(sel).limit(limit).lean().catch(() => []);
    }
    if (!docs.length) {
        docs = await PlatformProduct.find({ orgId, active: { $ne: false }, "productImages.0": { $exists: true } })
            .select(sel).sort({ _id: -1 }).limit(limit).lean().catch(() => []);
    }
    return docs.map((p) => toItem(p, baseUrl));
}

// Resolve every "products" block in a campaign's block array (attach .items) before rendering.
export async function resolveCampaignBlocks(orgId, blocks = [], baseUrl = "") {
    if (!Array.isArray(blocks)) return [];
    return Promise.all(blocks.map(async (b) => {
        if (b?.type !== "products") return b;
        const items = await resolveProducts(orgId, { query: b.query, ids: b.productIds, limit: b.limit || 3, baseUrl });
        return { ...b, items };
    }));
}
