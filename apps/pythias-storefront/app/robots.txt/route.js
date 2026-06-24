export const dynamic = "force-dynamic";

// GET /robots.txt — host-aware.
// • Pythias-provided store subdomains (*.STOREFRONT_BASE_DOMAIN): these are kept out of Google
//   (middleware sets X-Robots-Tag: noindex). We still allow crawling here so that noindex is actually
//   seen, and we DON'T advertise a sitemap (the canonical store is the seller's custom domain).
// • Registered custom domains: fully indexable — normal crawl rules + sitemap. We keep bots out of the
//   infinite free-text search / faceted space (the big compute drain); Disallow blocks the fetch
//   entirely (noindex would not — Google still crawls noindex URLs).
export async function GET(req) {
    const origin = new URL(req.url).origin;
    const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
    const base = (process.env.STOREFRONT_BASE_DOMAIN || "pythias.store").toLowerCase();
    const isPythiasHost = host === base || host.endsWith("." + base) || host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.");

    const lines = ["User-agent: *", "Allow: /", "Disallow: /account", "Disallow: /checkout", "Disallow: /cart"];
    if (isPythiasHost) {
        // No sitemap; the subdomain is noindexed and its canonical points at the custom domain.
        lines.push("");
    } else {
        lines.push(
            "Disallow: /search",            // legacy → redirects to /products anyway
            "Disallow: /*?q=",              // free-text search results (infinite space)
            "Disallow: /*?*sort=",          // faceted sort/filter permutations
            "Disallow: /*?*filter=",
            `Sitemap: ${origin}/sitemap.xml`,
            "",
        );
    }
    return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
