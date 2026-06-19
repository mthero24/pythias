export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformProduct } from "@pythias/mongo";
import { productHref } from "@pythias/storefront";

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/search/suggest?q= — typeahead suggestions: a few matching products (thumb + title → product
// page) and matching search terms (tags/categories/departments → search). Lightweight Mongo regex; kept
// separate from the heavier faceted search so it stays snappy on every keystroke.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ error: false, products: [], terms: [] });

    const orgId = site.orgId;
    const mode = site.productUrlMode || "slug";
    const rx = new RegExp(esc(q), "i");

    try {
        const [docs, termAgg] = await Promise.all([
            PlatformProduct.find({ orgId, active: { $ne: false }, title: rx })
                .select("title slug sku productImages design").sort({ _id: -1 }).limit(6).lean(),
            PlatformProduct.aggregate([
                { $match: { orgId, active: { $ne: false } } },
                { $project: { t: { $setUnion: [{ $ifNull: ["$tags", []] }, { $ifNull: ["$category", []] }, { $ifNull: ["$department", []] }] } } },
                { $unwind: "$t" },
                { $match: { t: rx } },
                { $group: { _id: "$t", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
        ]);

        // One suggestion per design so the dropdown isn't the same artwork on six blanks.
        const seen = new Set();
        const products = [];
        for (const p of docs) {
            const d = p.design ? String(p.design) : null;
            if (d && seen.has(d)) continue;
            if (d) seen.add(d);
            products.push({ id: String(p._id), title: p.title, image: (p.productImages || []).find((i) => i.image)?.image || null, href: productHref(p, mode) });
        }
        const terms = termAgg.map((t) => t._id).filter((t) => t != null && String(t).trim() !== "");
        return NextResponse.json({ error: false, products, terms });
    } catch {
        return NextResponse.json({ error: false, products: [], terms: [] });
    }
}
