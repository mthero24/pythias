import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { StorefrontCollection } from "@pythias/mongo";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return siteMetadata({ title: "Collections" }); }

export default async function CollectionsIndex() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    const collections = await StorefrontCollection.find({ orgId: site.orgId, status: "published" }).select("slug title description image").sort({ updatedAt: -1 }).limit(200).lean();

    return (
        <SiteFrame site={site}>
            <section style={{ padding: "48px 0" }}>
                <div className="sf-container">
                    <h1 style={{ fontSize: "2rem", margin: "0 0 24px" }}>Collections</h1>
                    {collections.length === 0 ? <p style={{ opacity: 0.6 }}>No collections yet.</p> : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 22 }}>
                            {collections.map((c) => (
                                <a key={c.slug} href={`/collections/${c.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <div style={{ aspectRatio: "16/10", background: "#f3f4f6", borderRadius: 12, overflow: "hidden" }}>
                                        {c.image && <img src={c.image} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div style={{ marginTop: 10, fontWeight: 700 }}>{c.title}</div>
                                    {c.description && <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>{c.description}</div>}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </SiteFrame>
    );
}
