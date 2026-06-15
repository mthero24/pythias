import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { StorefrontPage } from "@pythias/mongo";
import { SiteFrame, SectionRenderer } from "@pythias/storefront";
import { resolveSectionData } from "@pythias/storefront/server";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

// Reserved top-level paths owned by real routes — never treated as custom pages.
const RESERVED = new Set(["products", "cart", "checkout", "account", "favorites", "feed", "api", "search", "collections", "gift-card-balance"]);

async function loadPage(host, slug) {
    if (RESERVED.has(slug)) return { site: null, page: null };
    const site = await resolveSite(host);
    if (!site) return { site: null, page: null };
    const page = await StorefrontPage.findOne({ orgId: site.orgId, slug: slug.toLowerCase(), status: "published" }).lean();
    return { site, page };
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { page } = await loadPage((await headers()).get("host"), slug);
    if (!page) return siteMetadata();
    return siteMetadata({ title: page.seo?.title || page.title, description: page.seo?.description });
}

export default async function CustomPage({ params }) {
    const { slug } = await params;
    const h = await headers();
    const { site, page } = await loadPage(h.get("host"), slug);
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
    const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: page.seo?.title || page.title, description: page.seo?.description, keywords: (page.keywords || []).join(", ") };

    return (
        <SiteFrame site={site}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <SectionRenderer sections={page.sections ?? []} site={site} data={data} />
        </SiteFrame>
    );
}
