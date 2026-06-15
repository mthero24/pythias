// Server-only: resolves the data each section needs (DB access lives here, not in the
// pure components). Returns an array aligned to `sections` — data[i] is the resolved
// data for sections[i], or null. The public app calls this server-side; the editor
// can call it behind an API route so its preview uses the exact same data shape.
import { PlatformProduct } from "@pythias/mongo";

async function featuredProducts(settings, ctx) {
    const limit = Math.min(Number(settings?.limit) || 8, 24);
    const products = await PlatformProduct.find({ orgId: ctx.orgId, active: { $ne: false } })
        .select("title productImages variantsArray")
        .limit(limit)
        .lean();
    return { products };
}

const RESOLVERS = {
    featuredProducts,
};

export async function resolveSectionData(sections = [], ctx = {}) {
    return Promise.all(
        sections.map(async (s) => {
            const fn = RESOLVERS[s?.type];
            if (!fn) return null;
            try { return await fn(s.settings ?? {}, ctx); }
            catch { return null; }
        })
    );
}
