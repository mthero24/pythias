export const dynamic = "force-dynamic";
import { PlatformProduct } from "@pythias/mongo";
import { resolveSite } from "@/lib/resolveSite";

// GET /feed/products.xml — per-store product feed in the Google Shopping RSS 2.0 spec.
// This ONE feed is accepted (via scheduled fetch, no OAuth) by Google Merchant Center,
// Microsoft/Bing Merchant Center, Meta (Facebook/Instagram) Catalog, Pinterest, and TikTok.
// API-push channels (X, Truth Social, real-time sync) are layered on top later.

const esc = (s) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

function abs(origin, url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return new Response("Not found", { status: 404 });
    const origin = new URL(req.url).origin;
    const brand = site.businessInfo?.legalName || site.name || "Store";

    let products = [];
    try {
        products = await PlatformProduct.find({ orgId: site.orgId, active: { $ne: false } })
            .populate("variantsArray.color", "name")
            .select("title description brand productImages variantsArray category department")
            .limit(5000).lean();
    } catch { products = []; }

    const items = [];
    for (const p of products) {
        const desc = p.description || p.title || "";
        const productType = [].concat(p.category || [], p.department || []).filter(Boolean).join(" > ");
        const fallbackImg = p.productImages?.find((i) => i.image)?.image;
        for (const v of p.variantsArray ?? []) {
            if (!v.sku || !(v.price > 0)) continue;
            const img = abs(origin, v.image || fallbackImg);
            const color = v.color?.name || v.ids?.colorName || "";
            const size = typeof v.size === "string" ? v.size : (v.ids?.sizeName || "");
            items.push(`    <item>
      <g:id>${esc(v.sku)}</g:id>
      <g:item_group_id>${esc(p._id)}</g:item_group_id>
      <g:title>${esc([p.title, color, size].filter(Boolean).join(" - "))}</g:title>
      <g:description>${esc(desc)}</g:description>
      <g:link>${esc(`${origin}/products/${p._id}`)}</g:link>
      ${img ? `<g:image_link>${esc(img)}</g:image_link>` : ""}
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${(v.price).toFixed(2)} USD</g:price>
      <g:brand>${esc(p.brand || brand)}</g:brand>
      ${v.gtin || v.upc ? `<g:gtin>${esc(v.gtin || v.upc)}</g:gtin>` : "<g:identifier_exists>no</g:identifier_exists>"}
      ${color ? `<g:color>${esc(color)}</g:color>` : ""}
      ${size ? `<g:size>${esc(size)}</g:size>` : ""}
      ${productType ? `<g:product_type>${esc(productType)}</g:product_type>` : ""}
    </item>`);
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(brand)}</title>
    <link>${esc(origin)}</link>
    <description>${esc(brand)} product feed</description>
${items.join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
    });
}
