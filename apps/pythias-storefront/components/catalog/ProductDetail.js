import { StorefrontReviewSummary, PlatformProduct, PlatformDesign, Organization, resolveVariantSize } from "@pythias/mongo";
import { SiteFrame, SectionRenderer, productJsonLd, productHref } from "@pythias/storefront";
import CustomizableBuyBox from "@/components/customizer/CustomizableBuyBox";
import ProductView from "@/components/catalog/ProductView";
import SizeChart from "@/components/catalog/SizeChart";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { systemPageSections } from "@/lib/systemSections";

// Product detail body (rendered by the unified /products/[[...path]] route when a path resolves to a
// product). Expects a lean product doc with variantsArray.color populated.
export default async function ProductDetail({ site, product, host }) {
    const mode = site.productUrlMode || "slug";
    const { sections: pageSections, data: pageSectionData } = await systemPageSections(site, "product");

    const images = [...new Set((product.productImages ?? []).map((i) => i.image).filter(Boolean))];
    // Color-tagged gallery for ProductView (so it can filter the carousel to the selected color + show the
    // right image per print placement). `side` = "front"/"back"/… from the product image.
    const galleryImages = (product.productImages ?? []).filter((i) => i.image).map((i) => ({ url: i.image, color: i.colorName || null, side: i.side || null }));
    const cat = site.catalog ?? {};
    const variants = (product.variantsArray ?? []).map((v) => ({
        sku:   v.sku ?? null,
        price: typeof v.price === "number" ? v.price : null,
        image: v.image ?? null,
        color: v.color?.name ?? v.ids?.colorName ?? "",
        hex:   v.color?.hexcode ?? null,
        size:  resolveVariantSize(v, v.blank?.sizes),
    }));
    const prices = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const minPrice = prices.length ? Math.min(...prices) : undefined;

    // Feature bullets come from the product's blank(s) (e.g. fabric, fit, care). Merge across blanks,
    // dedupe by title, and keep only ones with real content.
    const bulletPoints = (() => {
        const seen = new Set(); const out = [];
        for (const b of (product.blanks || [])) for (const bp of (b?.bulletPoints || [])) {
            const title = (bp?.title || "").trim(); const description = (bp?.description || "").trim();
            const key = `${title}|${description}`.toLowerCase();
            if ((!title && !description) || seen.has(key)) continue;
            seen.add(key); out.push({ title, description });
        }
        return out;
    })();

    // Size chart comes from the blank's structured size guide (set by the FC customer); first enabled one.
    const sizeGuide = (product.blanks || []).map((b) => b?.sizeGuide).find((g) => g?.enabled) || null;

    // Print placements available for this product — derived from the blank's print boxes (front/back/pocket).
    // First spot is included in the base price; each additional adds the blank's per-spot surcharge.
    const primaryBlank = (product.blanks || [])[0] || null;
    const placement = (() => {
        if (!primaryBlank) return null;
        // Classify each ACTUAL box key into a kind, but keep the real key (renderImages matches the real
        // box key — "center"/"leftChest"/etc., not a generic "front"/"pocket"). One representative per kind.
        // pocket / left-chest boxes are small front-side prints; center / full-front are the main front.
        const kindOf = (k) => /back/i.test(k) ? "back"
            : /pocket|left.?chest/i.test(k) ? "pocket"
            : /sleeve|arm/i.test(k) ? null
            : /front|center|chest|full|default/i.test(k) ? "front" : null;
        const byKind = {};
        for (const im of (primaryBlank.images || [])) for (const k of Object.keys(im?.boxes || {})) {
            const kind = kindOf(k);
            if (kind && !byKind[kind]) byKind[kind] = k;   // first box key seen for each kind
        }
        const order = ["front", "back", "pocket"];
        const labels = { front: "Front", back: "Back", pocket: "Pocket" };
        const spots = order.filter((kind) => byKind[kind]).map((kind) => ({ kind, key: byKind[kind], label: labels[kind] }));
        if (spots.length < 1) return null;
        return { spots, surchargeCents: Math.round(primaryBlank.extraLocationPriceCents || 0), blankId: String(primaryBlank._id), blankCode: primaryBlank.code || "", blankName: primaryBlank.name || "" };
    })();

    // Print-placement customization is ONLY for single-image designs: if the design has art for just one
    // side, the buyer can move it to any spot (rendered on the fly by the org's compositor). Multi-location
    // designs render natively (no placement choice). Needs the org's render subdomain + the design art.
    let printRender = null;
    if (placement && product.design) {
        const [designDoc, org] = await Promise.all([
            PlatformDesign.findOne({ _id: product.design }).select("images").lean().catch(() => null),
            Organization.findOne({ _id: site.orgId }).select("slug").lean().catch(() => null),
        ]);
        const imgs = designDoc?.images || {};
        const labeled = Object.keys(imgs).filter((k) => imgs[k]);
        if (labeled.length === 1 && org?.slug && placement.blankCode) {
            printRender = { orgSlug: org.slug, blankCode: placement.blankCode, art: imgs[labeled[0]], artSide: labeled[0] };
        }
    }

    // "Also available as" — sibling products sharing this design (POD: same artwork on other blanks).
    // The deduped catalog/search grids show one card per design, so this is how a shopper reaches the
    // hoodie/tank of a tee they found. Label by garment (category) → blank name → title.
    let siblings = [];
    if (product.design) {
        const sibs = await PlatformProduct.find({
            orgId: site.orgId, active: { $ne: false },
            design: product.design, _id: { $ne: product._id },
        }).populate({ path: "blanks", select: "name" }).select("title slug sku productImages category department blanks design").limit(12).lean().catch(() => []);
        siblings = sibs.map((s) => ({
            href:  productHref(s, mode),
            title: s.title,
            label: s.category?.[0] || s.blanks?.[0]?.name || s.title,
            image: (s.productImages || []).find((i) => i?.image)?.image || null,
        }));
    }

    const summary = await StorefrontReviewSummary.findOne({ orgId: site.orgId, productId: product._id }).select("avg count").lean().catch(() => null);
    const jsonLd = productJsonLd({ title: product.title, description: product.description, images, price: minPrice });
    if (summary?.count > 0) jsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue: summary.avg, reviewCount: summary.count };

    const origin = `https://${host}`;
    const brand = site.businessInfo?.legalName || site.name || "Store";
    const orgLd = { "@context": "https://schema.org", "@type": "Organization", name: brand, url: origin, ...(site.theme?.logoUrl ? { logo: site.theme.logoUrl } : {}) };
    const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${origin}/products` },
        { "@type": "ListItem", position: 3, name: product.title, item: `${origin}${productHref(product, mode)}` },
    ] };

    return (
        <SiteFrame site={site}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <section style={{ padding: "40px 0" }}>
                <div className="sf-container">
                    {product.designTemplateId ? (
                        // Customizable products keep the personalization buy box (its own UI).
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 48, alignItems: "start" }}>
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
                                <CustomizableBuyBox productId={String(product._id)} title={product.title} images={images} variants={variants} templateId={String(product.designTemplateId)} />
                            </div>
                        </div>
                    ) : (
                        <ProductView productId={String(product._id)} title={product.title} images={galleryImages} variants={variants} siblings={siblings}
                            thumbs={cat.galleryThumbs || "bottom"} galleryScope={cat.galleryScope || "all"} defaultColor={product.defaultColor?.name || ""}
                            placement={placement} printRender={printRender} designId={product.design ? String(product.design) : null} />
                    )}

                    {(product.description || bulletPoints.length > 0) && (
                        <div style={{ marginTop: 44, maxWidth: 820, borderTop: "1px solid var(--sf-border, #e5e7eb)", paddingTop: 28 }}>
                            <h2 style={{ fontSize: "1.15rem", margin: "0 0 16px", fontWeight: 700 }}>Product details</h2>
                            {product.description && (
                                <div style={{ lineHeight: 1.8, color: "var(--sf-text)", opacity: 0.92, whiteSpace: "pre-wrap", fontSize: "0.98rem" }}>{product.description}</div>
                            )}
                            {bulletPoints.length > 0 && (
                                <ul style={{ listStyle: "none", padding: 0, margin: product.description ? "22px 0 0" : 0, display: "grid", gap: 12 }}>
                                    {bulletPoints.map((bp, i) => (
                                        <li key={i} style={{ display: "flex", gap: 10, lineHeight: 1.6, fontSize: "0.95rem" }}>
                                            <span aria-hidden style={{ color: "var(--sf-accent, #f59e0b)", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                                            <span>
                                                {bp.title && <strong style={{ fontWeight: 700 }}>{bp.title}{bp.description ? ": " : ""}</strong>}
                                                {bp.description && <span style={{ opacity: 0.9 }}>{bp.description}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <SizeChart guide={sizeGuide} />
                </div>
            </section>
            <section id="review" style={{ padding: "0 0 56px" }}>
                <div className="sf-container">
                    <ReviewsSection productId={String(product._id)} />
                </div>
            </section>
            <SectionRenderer sections={pageSections} site={site} data={pageSectionData} />
        </SiteFrame>
    );
}
