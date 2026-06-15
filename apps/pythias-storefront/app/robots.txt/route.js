export const dynamic = "force-dynamic";

// GET /robots.txt — allow crawling, point to the per-store sitemap.
export async function GET(req) {
    const origin = new URL(req.url).origin;
    const body = `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /checkout\nDisallow: /cart\nSitemap: ${origin}/sitemap.xml\n`;
    return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
