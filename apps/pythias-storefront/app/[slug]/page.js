import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { StorefrontPage } from "@pythias/mongo";
import { SiteFrame, SectionRenderer } from "@pythias/storefront";
import { resolveSectionData } from "@pythias/storefront/server";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";
import { sectionExperimentsForPage } from "@/lib/experiments";
import SectionVariants from "@/components/experiments/SectionVariants";

export const dynamic = "force-dynamic";

// Reserved top-level paths owned by real routes — never treated as custom pages.
const RESERVED = new Set(["products", "cart", "checkout", "account", "favorites", "feed", "api", "search", "collections", "gift-card-balance"]);

async function loadPage(host, slug, preview) {
    if (RESERVED.has(slug)) return { site: null, page: null };
    const live = await resolveSite(host);
    if (!live) return { site: null, page: null };
    const site = withDraft(live, preview);
    // In preview, a builder page from the draft (the editor's per-page sections) wins so the seller
    // can preview unpublished pages; otherwise serve the published SEO landing page.
    const builderPage = preview ? (site.pages ?? []).find((p) => p.slug === slug.toLowerCase()) : null;
    const page = builderPage
        || await StorefrontPage.findOne({ orgId: live.orgId, slug: slug.toLowerCase(), status: "published" }).lean();
    return { site, page };
}

export async function generateMetadata({ params, searchParams }) {
    const { slug } = await params;
    const preview = previewAllowed(await searchParams);
    const { page } = await loadPage((await headers()).get("host"), slug, preview);
    if (!page) return siteMetadata();
    return siteMetadata({ title: page.seo?.title || page.title, description: page.seo?.description, image: page.seo?.ogImage, path: `/${slug}` });
}

export default async function CustomPage({ params, searchParams }) {
    const { slug } = await params;
    const preview = previewAllowed(await searchParams);
    const h = await headers();
    const { site, page } = await loadPage(h.get("host"), slug, preview);
    if (!site) return <NoSite />;

    if (!page) {
        return (
            <SiteFrame site={site}>
                <section style={{ padding: "80px 0", textAlign: "center" }}>
                    <div className="sf-container"><h1>Page not found</h1><p style={{ opacity: 0.6 }}><a href="/" style={{ color: "var(--sf-secondary)" }}>← Home</a></p></div>
                </section>
            </SiteFrame>
        );
    }

    const data = await resolveSectionData(page.sections ?? [], { orgId: site.orgId });
    const experiments = preview ? {} : await sectionExperimentsForPage(site.orgId, page.slug || slug.toLowerCase());
    const host = h.get("host");
    const origin = host ? `https://${host}` : "";
    const pageUrl = `${origin}/${slug}`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage", "@id": pageUrl, url: pageUrl,
                name: page.seo?.title || page.title,
                ...(page.seo?.description ? { description: page.seo.description } : {}),
                ...(page.keywords?.length ? { keywords: page.keywords.join(", ") } : {}),
                ...(page.publishedAt ? { datePublished: new Date(page.publishedAt).toISOString() } : {}),
                ...(page.updatedAt ? { dateModified: new Date(page.updatedAt).toISOString() } : {}),
                isPartOf: { "@type": "WebSite", name: site.name || site.subdomain, url: origin },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: origin },
                    { "@type": "ListItem", position: 2, name: page.title, item: pageUrl },
                ],
            },
        ],
    };

    return (
        <SiteFrame site={site}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <SectionRenderer sections={page.sections ?? []} site={site} data={data} experiments={experiments} ExperimentSlot={SectionVariants} />
        </SiteFrame>
    );
}
