export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveSite } from "@/lib/resolveSite";
import { searchProducts } from "@/lib/catalog";

// GET /api/search?q= — on-site product search (public, per store). Returns shaped products;
// faceted filtering happens client-side on the result set.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const q = new URL(req.url).searchParams.get("q") || "";
    const products = await searchProducts(site.orgId, q, 200);
    return NextResponse.json({ error: false, q, count: products.length, products });
}
