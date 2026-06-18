export const dynamic = "force-dynamic";
import { PlatformProduct, StorefrontPage, Blank } from "@pythias/mongo";
import { resolveSite } from "@/lib/resolveSite";

const esc = (s) => String(s).replace(/&/g, "&amp;");

// GET /sitemap.xml — per-store sitemap: home, shop, every product, and published landing pages.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return new Response("Not found", { status: 404 });
    const origin = new URL(req.url).origin;

    const urls = [`${origin}/`, `${origin}/products`];
    // The "create your own" design studio — only list it if there are customizable blanks.
    try {
        if (await Blank.exists({ orgId: site.orgId, active: { $ne: false } })) urls.push(`${origin}/create-your-own`);
    } catch { /* ignore */ }
    try {
        const mode = site.productUrlMode || "slug";
        const products = await PlatformProduct.find({ orgId: site.orgId, active: { $ne: false } }).select("_id slug sku").limit(5000).lean();
        for (const p of products) {
            const seg = mode === "slug" && p.slug ? p.slug : mode === "sku" && p.sku ? encodeURIComponent(p.sku) : p._id;
            urls.push(`${origin}/products/${seg}`);
        }
    } catch { /* ignore */ }
    try {
        const pages = await StorefrontPage.find({ orgId: site.orgId, status: "published" }).select("slug").limit(2000).lean();
        for (const pg of pages) urls.push(`${origin}/${pg.slug}`);
    } catch { /* ignore */ }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n")}
</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
