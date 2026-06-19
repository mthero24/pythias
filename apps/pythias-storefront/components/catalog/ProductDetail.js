import { StorefrontReviewSummary, PlatformProduct, PlatformDesign, Organization, resolveVariantSize } from "@pythias/mongo";
import { SiteFrame, SectionRenderer, productJsonLd, productHref, ProductCard, productCardData, dedupeByDesign } from "@pythias/storefront";
import RecentlyViewed from "@/components/catalog/RecentlyViewed";
import CustomizableBuyBox from "@/components/customizer/CustomizableBuyBox";
import ProductView from "@/components/catalog/ProductView";
import SizeChart from "@/components/catalog/SizeChart";
import Accordion from "@/components/catalog/Accordion";
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
        compareAt: typeof v.compareAtPrice === "number" && v.compareAtPrice > 0 ? v.compareAtPrice : null,
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
    let printRender = null, customizeArt = null;
    if (product.design) {
        const [designDoc, org] = await Promise.all([
            PlatformDesign.findOne({ _id: product.design }).select("images").lean().catch(() => null),
            Organization.findOne({ _id: site.orgId }).select("slug").lean().catch(() => null),
        ]);
        const imgs = designDoc?.images || {};
        const labeled = Object.keys(imgs).filter((k) => imgs[k]);
        customizeArt = labeled.length ? imgs[labeled[0]] : null;   // design art to drop into the studio
        if (placement && labeled.length === 1 && org?.slug && placement.blankCode) {
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

    // "You may also like" — other products in the same category/department (different designs from this one).
    let related = [];
    {
        const cats = [...(product.category || []), ...(product.department || [])].filter(Boolean);
        const q = { orgId: site.orgId, active: { $ne: false }, _id: { $ne: product._id } };
        if (product.design) q.design = { $ne: product.design };   // the same-design blanks are in "Also available as"
        if (cats.length) q.$or = [{ category: { $in: cats } }, { department: { $in: cats } }];
        const docs = await PlatformProduct.find(q).populate("variantsArray.color", "name hexcode")
            .select("title slug sku brand productImages variantsArray category department design createdAt salePercent")
            .sort({ _id: -1 }).limit(16).lean().catch(() => []);
        related = dedupeByDesign(docs.map(productCardData)).slice(0, 8);
    }

    const summary = await StorefrontReviewSummary.findOne({ orgId: site.orgId, productId: product._id }).select("avg count").lean().catch(() => null);
    // Shipping / returns copy for the detail accordions (from the store's policy pages).
    const policyBody = (re) => (site.policies || []).find((p) => re.test(p.slug || "") || re.test(p.title || ""))?.body || null;
    const shippingBody = policyBody(/ship/i);
    const returnsBody = policyBody(/return|refund/i);
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
            <section style={{ padding: "28px 0 40px" }}>
                <div className="sf-container">
                    <nav aria-label="Breadcrumb" style={{ fontSize: "0.82rem", color: "var(--sf-muted, #64748b)", marginBottom: 22 }}>
                        <a href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</a>
                        <span style={{ margin: "0 7px", opacity: 0.5 }}>/</span>
                        <a href="/products" style={{ color: "inherit", textDecoration: "none" }}>Shop</a>
                        <span style={{ margin: "0 7px", opacity: 0.5 }}>/</span>
                        <span style={{ color: "var(--sf-text)" }}>{product.title}</span>
                    </nav>
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
                            placement={placement} printRender={printRender}
                            rating={summary?.count > 0 ? { avg: summary.avg, count: summary.count } : null}
                            shipping={site.shipping || null} hasSizeChart={!!sizeGuide} salePercent={product.salePercent || 0}
                            customizeBlankId={primaryBlank ? String(primaryBlank._id) : ""} customizeArt={customizeArt} />
                    )}

                    {(product.description || bulletPoints.length > 0 || shippingBody || returnsBody) && (
                        <div style={{ marginTop: 44, maxWidth: 820 }}>
                            {(product.description || bulletPoints.length > 0) && (
                                <Accordion title="Product details" defaultOpen>
                                    {product.description && <div style={{ whiteSpace: "pre-wrap" }}>{product.description}</div>}
                                    {bulletPoints.length > 0 && (
                                        <ul style={{ listStyle: "none", padding: 0, margin: product.description ? "18px 0 0" : 0, display: "grid", gap: 12 }}>
                                            {bulletPoints.map((bp, i) => (
                                                <li key={i} style={{ display: "flex", gap: 10, lineHeight: 1.6 }}>
                                                    <span aria-hidden style={{ color: "var(--sf-accent, #f59e0b)", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                                                    <span>{bp.title && <strong style={{ fontWeight: 700 }}>{bp.title}{bp.description ? ": " : ""}</strong>}{bp.description && <span style={{ opacity: 0.9 }}>{bp.description}</span>}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Accordion>
                            )}
                            {shippingBody && <Accordion title="Shipping"><div style={{ whiteSpace: "pre-wrap" }}>{shippingBody}</div></Accordion>}
                            {returnsBody && <Accordion title="Returns"><div style={{ whiteSpace: "pre-wrap" }}>{returnsBody}</div></Accordion>}
                        </div>
                    )}

                    <SizeChart guide={sizeGuide} />
                </div>
            </section>
            <section id="review" style={{ padding: "0 0 40px" }}>
                <div className="sf-container">
                    <ReviewsSection productId={String(product._id)} />
                </div>
            </section>

            {(related.length > 0) && (
                <section style={{ padding: "0 0 8px" }}>
                    <div className="sf-container">
                        <h2 style={{ fontSize: "1.3rem", margin: "0 0 18px" }}>You may also like</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 22 }}>
                            {related.map((p) => <ProductCard key={p.id} product={p} urlMode={mode} />)}
                        </div>
                    </div>
                </section>
            )}

            <section style={{ padding: "0 0 56px" }}>
                <div className="sf-container">
                    <RecentlyViewed current={{ id: String(product._id), title: product.title, image: images[0] || null, href: productHref(product, mode), priceCents: minPrice ? Math.round(minPrice * 100) : 0 }} />
                </div>
            </section>

            <SectionRenderer sections={pageSections} site={site} data={pageSectionData} />
        </SiteFrame>
    );
}
