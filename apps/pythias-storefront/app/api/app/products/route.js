export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { searchProductsFaceted } from "@/lib/catalog";

// GET /api/app/products — catalog browse + search for the native mobile app (home, category, search).
// Tenant resolved by the x-pythias-app-key header (resolveOrg). Reuses the same faceted catalog query
// the web search uses, so the app and web stay in sync.
//   ?q=          search text
//   ?sort=       featured | price-asc | price-desc | newest
//   ?department= ?category= ?color= ?size= ?brand=   (repeatable filters)
//   ?maxPrice=   dollars
//   ?limit=      default 60
// Returns { products, facets, tags }.
export async function GET(req) {
    const ctx = await resolveOrg(req);
    if (!ctx?.site) return NextResponse.json({ error: "unknown_app" }, { status: 404 });
    if (req.headers.get("x-pythias-app-key") && !ctx.site.appEnabled) {
        return NextResponse.json({ error: "app_not_enabled" }, { status: 403 });
    }

    const sp = new URL(req.url).searchParams;
    const filters = {
        departments: sp.getAll("department"),
        categories: sp.getAll("category"),
        colors: sp.getAll("color"),
        sizes: sp.getAll("size"),
        brands: sp.getAll("brand"),
    };
    if (sp.get("maxPrice")) filters.maxPriceCents = Math.round(Number(sp.get("maxPrice")) * 100);

    const { products, facets, tags } = await searchProductsFaceted(ctx.orgId, {
        q: sp.get("q") || "",
        filters,
        sort: sp.get("sort") || "featured",
        limit: Math.min(Number(sp.get("limit")) || 60, 200),
    });
    return NextResponse.json({ error: false, products, facets, tags });
}
