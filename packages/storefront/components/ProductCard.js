"use client";
import { useEffect, useState } from "react";
import { productHref } from "../lib/url";

// Product card for the FeaturedProducts section and the catalog/search/collection grids. Expects a
// shaped product (productCardData): image, priceCents, colorImages [{name,hex,image}], altImage.
// Color swatches and the "more views" badge swap the displayed image (clicks don't navigate). When
// `quickAdd` is on, a hover "+" button adds the default variant (dispatches a window event → cart).
export default function ProductCard({ product, rating, urlMode = "slug", showSwatches = true, showAltView = true, quickAdd = false }) {
    const colorImages = showSwatches ? (product.colorImages || []).filter((c) => c.image || c.hex) : [];
    const [img, setImg] = useState(product.image || (product.colorImages || []).find((c) => c.image)?.image || null);
    const from = typeof product.priceCents === "number" && product.priceCents > 0 ? product.priceCents / 100 : null;
    const r = rating?.count > 0 ? Math.round(rating.avg) : 0;
    const showAlt = showAltView && product.altImage && product.altImage !== img;
    const swap = (e, src) => { e.preventDefault(); if (src) setImg(src); };

    // Reveal the quick-add on hover; on touch devices (no hover) keep it visible so it's reachable.
    const [hovering, setHovering] = useState(false);
    const [hoverCapable, setHoverCapable] = useState(true);
    useEffect(() => { setHoverCapable(typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches !== false); }, []);
    const showQuick = quickAdd && (hovering || !hoverCapable);

    // If the product has real choices, open the variant picker; otherwise add the only variant directly.
    const needsPicker = (product.colors?.length > 1) || (product.sizes?.length > 1);
    const quickAddToCart = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (needsPicker) {
            window.dispatchEvent(new CustomEvent("sf:quick-add-open", { detail: { productId: product.id } }));
        } else {
            window.dispatchEvent(new CustomEvent("sf:add-to-cart", { detail: {
                productId: product.id, sku: product.defaultSku || product.sku || null, title: product.title,
                priceCents: product.defaultPriceCents ?? product.priceCents, color: product.defaultColor || "",
                size: product.defaultSize || "", image: img,
            } }));
        }
    };

    return (
        <a href={productHref(product, urlMode)} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
            style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <div style={{ position: "relative", aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                {img && <img src={img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {showAlt && (
                    <span title="More views" onClick={(e) => swap(e, product.altImage)}
                        style={{ position: "absolute", left: 8, bottom: 8, width: 44, height: 44, borderRadius: 8, cursor: "pointer",
                            border: "2px solid #fff", boxShadow: "0 1px 6px rgba(0,0,0,0.3)", background: `#fff url(${product.altImage}) center/cover no-repeat` }} />
                )}
                {quickAdd && (
                    <button onClick={quickAddToCart} aria-label="Add to cart" title="Add to cart"
                        style={{ position: "absolute", right: 8, bottom: 8, width: 40, height: 40, borderRadius: "50%", border: "none",
                            cursor: "pointer", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontSize: "1.5rem", lineHeight: 1,
                            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
                            opacity: showQuick ? 1 : 0, transform: showQuick ? "scale(1)" : "scale(0.7)", pointerEvents: showQuick ? "auto" : "none",
                            transition: "opacity 150ms, transform 150ms" }}>+</button>
                )}
            </div>

            {colorImages.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {colorImages.slice(0, 6).map((c, i) => (
                        <span key={i} title={c.name} onClick={(e) => swap(e, c.image)}
                            style={{ width: 18, height: 18, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
                                border: "1px solid rgba(0,0,0,0.2)",
                                boxShadow: img && img === c.image ? "0 0 0 2px var(--sf-accent,#f59e0b)" : "none",
                                background: c.hex ? c.hex : (c.image ? `#fff url(${c.image}) center/cover no-repeat` : "#ddd") }} />
                    ))}
                    {colorImages.length > 6 && <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>+{colorImages.length - 6}</span>}
                </div>
            )}

            <div style={{ marginTop: 8, fontWeight: 600, fontSize: "0.95rem" }}>{product.title}</div>
            {rating?.count > 0 && <div style={{ fontSize: "0.8rem" }}><span style={{ color: "#f59e0b" }}>{"★★★★★".slice(0, r)}{"☆☆☆☆☆".slice(0, 5 - r)}</span> <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>({rating.count})</span></div>}
            {from != null && <div style={{ color: "var(--sf-secondary)", fontWeight: 700, marginTop: 2 }}>${from.toFixed(2)}</div>}
        </a>
    );
}
