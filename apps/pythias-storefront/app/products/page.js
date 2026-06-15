import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformProduct } from "@pythias/mongo";
import { SiteFrame, ProductCard } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import { siteMetadata } from "@/lib/siteMeta";

// Plain favorite payload from a listing product (no variant chosen — cart falls back to the
// first variant when added, and re-prices at checkout regardless).
function favOf(p) {
    const prices = (p.variantsArray ?? []).map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    return {
        productId: String(p._id),
        title: p.title,
        image: p.productImages?.find((i) => i.image)?.image ?? null,
        priceCents: prices.length ? Math.round(Math.min(...prices) * 100) : 0,
    };
}

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    return siteMetadata({ title: "Shop" });
}

export default async function ProductsPage() {
    const h = await headers();
    const site = await resolveSite(h.get("host"));
    if (!site) return <NoSite />;

    let products = [];
    try {
        products = await PlatformProduct.find({ orgId: site.orgId, active: { $ne: false } })
            .select("title productImages variantsArray")
            .sort({ _id: -1 })
            .limit(200)
            .lean();
    } catch {
        products = [];
    }

    return (
        <SiteFrame site={site}>
            <section style={{ padding: "48px 0" }}>
                <div className="sf-container">
                    <h1 style={{ fontSize: "2rem", margin: "0 0 24px" }}>Shop</h1>
                    {products.length === 0 ? (
                        <p style={{ opacity: 0.6 }}>No products yet.</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                            {products.map((p) => (
                                <div key={p._id} style={{ position: "relative" }}>
                                    <FavoriteHeart overlay product={favOf(p)} />
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </SiteFrame>
    );
}
