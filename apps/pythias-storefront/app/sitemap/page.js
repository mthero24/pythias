import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import { PlatformProduct, StorefrontPage, Blank } from "@pythias/mongo";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    return siteMetadata({ title: "Sitemap" });
}

// Human-readable sitemap (the footer link). The crawler version lives at /sitemap.xml.
export default async function SitemapPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;

    const groups = [];

    const shop = [
        { label: "Home", href: "/" },
        { label: "Shop all products", href: "/products" },
        { label: "Collections", href: "/collections" },
    ];
    try { if (await Blank.exists({ orgId: site.orgId, active: { $ne: false } })) shop.push({ label: "Create your own", href: "/create-your-own" }); } catch { /* ignore */ }
    groups.push({ title: "Shop", links: shop });

    try {
        const pages = await StorefrontPage.find({ orgId: site.orgId, status: "published" }).select("slug title").sort({ title: 1 }).limit(500).lean();
        if (pages.length) groups.push({ title: "Pages", links: pages.map((p) => ({ label: p.title || p.slug, href: `/${p.slug}` })) });
    } catch { /* ignore */ }

    const policies = (site.policies ?? []).filter((p) => p && p.slug && p.body && String(p.body).trim());
    if (policies.length) groups.push({ title: "Legal", links: policies.map((p) => ({ label: p.title || p.slug, href: `/policies/${p.slug}` })) });

    // A small sampling of products so the page is useful but not gigantic (full list is in /sitemap.xml).
    try {
        const products = await PlatformProduct.find({ orgId: site.orgId, active: { $ne: false } }).select("title").sort({ _id: -1 }).limit(100).lean();
        if (products.length) groups.push({ title: "Featured products", links: products.map((p) => ({ label: p.title || "Product", href: `/products/${p._id}` })) });
    } catch { /* ignore */ }

    return (
        <SiteFrame site={site}>
            <section style={{ padding: "56px 0" }}>
                <div className="sf-container" style={{ maxWidth: 900 }}>
                    <h1 style={{ fontSize: "2rem", margin: "0 0 28px" }}>Sitemap</h1>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 32 }}>
                        {groups.map((g, i) => (
                            <div key={i}>
                                <h2 style={{ fontSize: "1.05rem", margin: "0 0 12px", paddingBottom: 6, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>{g.title}</h2>
                                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                                    {g.links.map((l, j) => (
                                        <li key={j}><a href={l.href} style={{ color: "var(--sf-secondary, inherit)", textDecoration: "none", fontSize: "0.92rem" }}>{l.label}</a></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </SiteFrame>
    );
}
