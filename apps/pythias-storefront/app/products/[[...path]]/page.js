import { headers } from "next/headers";
import { cache } from "react";
import mongoose from "mongoose";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { PlatformProduct, StorefrontPage } from "@pythias/mongo";
import { SiteFrame, SectionRenderer, slugifyName, productHref } from "@pythias/storefront";
import { resolveSectionData } from "@pythias/storefront/server";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";
import { systemPageSections } from "@/lib/systemSections";
import { searchProductsFaceted } from "@/lib/catalog";
import ProductDetail from "@/components/catalog/ProductDetail";
import SearchBox from "@/components/catalog/SearchBox";
import FilterableProductGrid from "@/components/catalog/FilterableProductGrid";

export const dynamic = "force-dynamic";

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const titleCase = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

async function resolveProductDoc(orgId, token) {
    const base = { orgId, active: { $ne: false } };
    const SELECT = "title description productImages variantsArray design designTemplateId slug sku blanks defaultColor category department salePercent";
    const pop = (qy) => qy.populate("variantsArray.color", "name hexcode").populate("variantsArray.blank", "sizes").populate("blanks", "bulletPoints sizeGuide images extraLocationPriceCents name code").populate("defaultColor", "name").select(SELECT);
    if (mongoose.Types.ObjectId.isValid(token)) {
        const byId = await pop(PlatformProduct.findOne({ ...base, _id: token })).lean().catch(() => null);
        if (byId) return byId;
    }
    // Resolve by slug, SKU (case-insensitive), or a stored alias (old/SKU handles). Canonical tag dedupes.
    const lc = String(token).toLowerCase();
    return pop(PlatformProduct.findOne({ ...base, $or: [{ slug: lc }, { sku: token }, { sku: lc }, { slugAliases: lc }] })).lean().catch(() => null);
}

// One resolver for the whole /products/* space. Precedence: manual landing page -> product -> search.
// Under /products there is NO 404 -- an unmatched path is simply treated as a search (rendered, but
// noindex unless it's real taxonomy / a curated term / a manual landing page).
// Keyed by a STRING (not the params array) so React.cache() dedupes between generateMetadata and the
// page render (arrays compare by reference and would miss the cache).
const resolvePath = cache(async (host, pathKey, q, preview) => {
    const live = await resolveSite(host);
    if (!live) return { kind: "nosite" };
    const site = withDraft(live, preview);
    const orgId = site.orgId;
    const segments = pathKey ? pathKey.split("/") : [];   // params.path is already URL-decoded by Next

    // /products (+ ?q=) -> catalog index / search
    if (segments.length === 0) {
        const term = (q || "").trim();
        const { products, facets, tags } = await searchProductsFaceted(orgId, { q: term, limit: 200 });
        return { kind: "index", site, term, products, facets, tags };
    }

    const fullPath = segments.join("/").toLowerCase();

    // 1) Manual landing page wins (StorefrontPage whose slug matches the path).
    const landing = await StorefrontPage.findOne(preview ? { orgId, slug: fullPath } : { orgId, slug: fullPath, status: "published" }).lean().catch(() => null);
    if (landing) return { kind: "landing", site, landing };

    // 2) Single segment -> a product?
    if (segments.length === 1) {
        const product = await resolveProductDoc(orgId, segments[0]);
        if (product) return { kind: "product", site, product };
    }

    // 3) Otherwise it's a search / category landing (never a 404).
    const term = segments.join(" ").replace(/-/g, " ").trim();
    const { products, facets, tags } = await searchProductsFaceted(orgId, { q: term, limit: 200 });
    const curated = (site.indexableTerms || []).map((t) => slugifyName(t));
    let taxonomy = false;
    try {
        const rxs = segments.map((s) => new RegExp("^" + esc(s.replace(/-/g, " ")) + "$", "i"));
        taxonomy = !!(await PlatformProduct.exists({ orgId, active: { $ne: false }, $or: [{ category: { $in: rxs } }, { department: { $in: rxs } }] }));
    } catch { /* ignore */ }
    const indexable = taxonomy || curated.includes(slugifyName(fullPath)) || curated.includes(slugifyName(term));

    // Pre-generated SEO copy (server-rendered, in the HTML) + a few aggregated tags for keyword context.
    const tc = (site.termContent || []).find((t) => t.term === slugifyName(fullPath) || t.term === slugifyName(term));
    const topTags = await aggregateTags(products.map((p) => p.id));
    return { kind: "search", site, term, products, facets, tags, indexable, heading: tc?.h1 || titleCase(term), description: tc?.description || "", topTags };
});

// Most common tags across the result set (a few, for on-page SEO context — not every tag from every product).
async function aggregateTags(ids) {
    if (!ids?.length) return [];
    const docs = await PlatformProduct.find({ _id: { $in: ids } }).select("tags").limit(200).lean().catch(() => []);
    const freq = new Map();
    for (const d of docs) for (const t of (d.tags || [])) { const k = String(t).trim(); if (k) freq.set(k, (freq.get(k) || 0) + 1); }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
}

const keyOf = (path) => (path || []).join("/");

export async function generateMetadata({ params, searchParams }) {
    const sp = await searchParams;
    const host = (await headers()).get("host");
    const r = await resolvePath(host, keyOf((await params).path), sp?.q, previewAllowed(sp));
    if (r.kind === "product") {
        const pimg = r.product.productImages?.[0] || (r.product.variantsArray || []).map((v) => v.image).find(Boolean) || "";
        const image = /^https?:\/\//.test(pimg) ? pimg : undefined;   // absolute only → else falls back to logo
        const path = productHref(r.product, r.site.productUrlMode || "slug");
        const base = await siteMetadata({ title: r.product.title, description: r.product.description, image, path });
        // Canonical = the slug form, so reaching the product by sku/_id/old-handle doesn't create duplicates.
        return { ...base, alternates: { canonical: `https://${host}${path}` } };
    }
    if (r.kind === "landing") return siteMetadata({ title: r.landing.seo?.title || r.landing.title, description: r.landing.seo?.description || r.landing.description });
    if (r.kind === "search") {
        const base = await siteMetadata({ title: r.heading });
        return { ...base, robots: r.indexable ? undefined : { index: false, follow: true } };   // keep junk searches out of the index
    }
    return siteMetadata({ title: "Shop" });
}

export default async function ProductsRoute({ params, searchParams }) {
    const sp = await searchParams;
    const host = (await headers()).get("host");
    const r = await resolvePath(host, keyOf((await params).path), sp?.q, previewAllowed(sp));
    if (r.kind === "nosite") return <NoSite />;
    const { site } = r;
    const urlMode = site.productUrlMode || "slug";

    if (r.kind === "product") return <ProductDetail site={site} product={r.product} host={host} />;

    if (r.kind === "landing") {
        const data = await resolveSectionData(r.landing.sections || [], { orgId: site.orgId });
        return <SiteFrame site={site}><SectionRenderer sections={r.landing.sections || []} site={site} data={data} /></SiteFrame>;
    }

    // index or search results (faceted grid + ?filters handled client-side)
    const isIndex = r.kind === "index";
    const heading = isIndex ? (r.term ? `Results for "${r.term}"` : "Shop") : (r.heading || "Search");
    const sys = isIndex ? await systemPageSections(site, "products") : { sections: [], data: [] };
    const tags = r.topTags || [];
    return (
        <SiteFrame site={site}>
            <section style={{ padding: "40px 0" }}>
                <div className="sf-container">
                    <SearchBox initial={r.term || ""} />
                    <h1 style={{ fontSize: "1.6rem", margin: "0 0 18px" }}>{heading}</h1>
                    <FilterableProductGrid products={r.products} urlMode={urlMode} catalog={site.catalog}
                        initialFacets={r.facets} initialTags={r.tags || []} searchContext={{ q: r.term || "" }}
                        emptyText={r.term ? `No products match "${r.term}".` : "No products yet."} />

                    {/* Server-rendered SEO copy (curated terms only) + a few aggregated tags — in the HTML for crawlers. */}
                    {tags.length > 0 && (
                        <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {tags.map((t) => (
                                <a key={t} href={`/products/${encodeURIComponent(t.toLowerCase().replace(/\s+/g, "-"))}`}
                                    style={{ fontSize: "0.82rem", padding: "5px 12px", borderRadius: 999, background: "rgba(0,0,0,0.05)", color: "var(--sf-text)", textDecoration: "none" }}>{t}</a>
                            ))}
                        </div>
                    )}
                    {r.description && (
                        <div style={{ marginTop: 28, maxWidth: 760, lineHeight: 1.7, color: "var(--sf-muted, #556)", fontSize: "0.96rem" }}>
                            <p style={{ margin: 0 }}>{r.description}</p>
                        </div>
                    )}
                </div>
            </section>
            {isIndex && <SectionRenderer sections={sys.sections} site={site} data={sys.data} />}
        </SiteFrame>
    );
}
