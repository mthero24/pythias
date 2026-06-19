export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveSite } from "@/lib/resolveSite";
import { searchProducts, searchProductsFaceted } from "@/lib/catalog";

// GET /api/search?q= — simple on-site product search (public, per store). Returns shaped products.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const q = new URL(req.url).searchParams.get("q") || "";
    const products = await searchProducts(site.orgId, q, 200);
    return NextResponse.json({ error: false, q, count: products.length, products });
}

// POST /api/search — faceted search. Body: { q, filters:{departments,categories,colors,sizes,brands,
// maxPriceCents}, sort }. Returns { products, facets } with server-side counts across the whole catalog.
export async function POST(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const { products, facets, tags } = await searchProductsFaceted(site.orgId, {
        q: body.q || "",
        filters: body.filters || {},
        sort: body.sort || "featured",
        limit: 200,
    });
    return NextResponse.json({ error: false, count: products.length, products, facets, tags });
}
