import { headers } from "next/headers";
import mongoose from "mongoose";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformProduct, StorefrontReviewSummary } from "@pythias/mongo";
import { SiteFrame, productJsonLd } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import BuyBox from "@/components/BuyBox";
import CustomizableBuyBox from "@/components/customizer/CustomizableBuyBox";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    // Site-level for now; product-title SEO is a later refinement.
    return siteMetadata();
}

export default async function ProductDetailPage({ params }) {
    const { id } = await params;
    const h = await headers();
    const site = await resolveSite(h.get("host"));
    if (!site) return <NoSite />;

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
        try {
            // Scoped to the site's org so one storefront can't load another's product.
            product = await PlatformProduct.findOne({ _id: id, orgId: site.orgId, active: { $ne: false } })
                .populate("variantsArray.color", "name")
                .select("title description productImages variantsArray designTemplateId")
                .lean();
        } catch { product = null; }
    }

    if (!product) {
        return (
            <SiteFrame site={site}>
                <section style={{ padding: "80px 0", textAlign: "center" }}>
                    <div className="sf-container">
                        <h1>Product not found</h1>
                        <p style={{ opacity: 0.6 }}><a href="/products" style={{ color: "var(--sf-secondary)" }}>← Back to shop</a></p>
                    </div>
                </section>
            </SiteFrame>
        );
    }

    // Serialize to a plain shape for the client BuyBox (no ObjectIds across the boundary).
    const images = [...new Set((product.productImages ?? []).map((i) => i.image).filter(Boolean))];
    const variants = (product.variantsArray ?? []).map((v) => ({
        sku:   v.sku ?? null,
        price: typeof v.price === "number" ? v.price : null,
        image: v.image ?? null,
        color: v.color?.name ?? v.ids?.colorName ?? "",
        size:  v.ids?.sizeName ?? (typeof v.size === "string" ? v.size : ""),
    }));

    const prices = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const minPrice = prices.length ? Math.min(...prices) : undefined;

    // Review summary → aggregateRating in structured data (rich-result stars in search).
    const summary = await StorefrontReviewSummary.findOne({ orgId: site.orgId, productId: product._id }).select("avg count").lean().catch(() => null);
    const jsonLd = productJsonLd({ title: product.title, description: product.description, images, price: minPrice });
    if (summary?.count > 0) {
        jsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue: summary.avg, reviewCount: summary.count };
    }

    // Organization + breadcrumb structured data (richer search results).
    const origin = `https://${h.get("host")}`;
    const brand = site.businessInfo?.legalName || site.name || "Store";
    const orgLd = { "@context": "https://schema.org", "@type": "Organization", name: brand, url: origin, ...(site.theme?.logoUrl ? { logo: site.theme.logoUrl } : {}) };
    const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${origin}/products` },
        { "@type": "ListItem", position: 3, name: product.title, item: `${origin}/products/${product._id}` },
    ] };

    return (
        <SiteFrame site={site}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <section style={{ padding: "40px 0" }}>
                <div className="sf-container" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 48, alignItems: "start" }}>
                    <div>
                        <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 12, overflow: "hidden" }}>
                            {images[0] && <img src={images[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        {images.length > 1 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                                {images.slice(0, 8).map((src, i) => (
                                    <img key={i} src={src} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, background: "#f3f4f6" }} />
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1.9rem", margin: "0 0 16px" }}>{product.title}</h1>
                        {product.designTemplateId
                            ? <CustomizableBuyBox productId={String(product._id)} title={product.title} images={images} variants={variants} templateId={String(product.designTemplateId)} />
                            : <BuyBox productId={String(product._id)} title={product.title} images={images} variants={variants} />}
                        {product.description && (
                            <div style={{ marginTop: 28, lineHeight: 1.7, opacity: 0.9, whiteSpace: "pre-wrap" }}>{product.description}</div>
                        )}
                    </div>
                </div>
            </section>
            <section id="review" style={{ padding: "0 0 56px" }}>
                <div className="sf-container">
                    <ReviewsSection productId={String(product._id)} />
                </div>
            </section>
        </SiteFrame>
    );
}
