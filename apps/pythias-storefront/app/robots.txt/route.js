export const dynamic = "force-dynamic";

// GET /robots.txt — allow crawling real pages, but keep bots OUT of the infinite free-text search /
// faceted space (the big compute drain). Disallow blocks the fetch entirely (noindex would not —
// Google still crawls noindex URLs). Curated category/landing paths stay crawlable.
export async function GET(req) {
    const origin = new URL(req.url).origin;
    const body = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /account",
        "Disallow: /checkout",
        "Disallow: /cart",
        "Disallow: /search",            // legacy → redirects to /products anyway
        "Disallow: /*?q=",              // free-text search results (infinite space)
        "Disallow: /*?*sort=",          // faceted sort/filter permutations
        "Disallow: /*?*filter=",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
    ].join("\n");
    return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
