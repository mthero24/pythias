import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { StorefrontCollection } from "@pythias/mongo";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import FilterableProductGrid from "@/components/catalog/FilterableProductGrid";
import { resolveCollectionProducts } from "@/lib/catalog";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

async function load(host, slug) {
    const site = await resolveSite(host);
    if (!site) return { site: null };
    const collection = await StorefrontCollection.findOne({ orgId: site.orgId, slug: slug.toLowerCase(), status: "published" }).lean();
    return { site, collection };
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { collection } = await load((await headers()).get("host"), slug);
    if (!collection) return siteMetadata();
    return siteMetadata({ title: collection.seo?.title || collection.title, description: collection.seo?.description || collection.description });
}

export default async function CollectionPage({ params }) {
    const { slug } = await params;
    const { site, collection } = await load((await headers()).get("host"), slug);
    if (!site) return <NoSite />;

    if (!collection) {
        return (
            <SiteFrame site={site}>
                <section style={{ padding: "80px 0", textAlign: "center" }}>
                    <div className="sf-container"><h1>Collection not found</h1><p style={{ opacity: 0.6 }}><a href="/collections" style={{ color: "var(--sf-secondary)" }}>← All collections</a></p></div>
                </section>
            </SiteFrame>
        );
    }

    const products = await resolveCollectionProducts(site.orgId, collection);

    return (
        <SiteFrame site={site}>
            <section style={{ padding: "40px 0" }}>
                <div className="sf-container">
                    <h1 style={{ fontSize: "1.9rem", margin: "0 0 6px" }}>{collection.title}</h1>
                    {collection.description && <p style={{ opacity: 0.7, margin: "0 0 24px", maxWidth: 640 }}>{collection.description}</p>}
                    <FilterableProductGrid products={products} emptyText="No products in this collection yet." />
                </div>
            </section>
        </SiteFrame>
    );
}
