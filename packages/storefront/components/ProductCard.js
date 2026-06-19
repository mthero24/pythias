"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { productHref } from "../lib/url";

// Product card for the FeaturedProducts section and the catalog/search/collection grids. Expects a
// shaped product (productCardData): image, priceCents, colorImages [{name,hex,image}], altImage.
// Color swatches and the "more views" badge swap the displayed image (clicks don't navigate). When
// `quickAdd` is on, a hover "+" button adds the default variant (dispatches a window event → cart).
export default function ProductCard({ product, rating, urlMode = "slug", preferColor = null, showSwatches = true, showAltView = true, quickAdd = false }) {
    const colorImages = showSwatches ? (product.colorImages || []).filter((c) => c.image || c.hex) : [];
    const colorImageOf = (name) => (product.colorImages || []).find((c) => c.name === name && c.image)?.image || null;
    // Default color, unless a color filter is active (preferColor) — then show that color's image.
    const [img, setImg] = useState((preferColor && colorImageOf(preferColor)) || product.image || (product.colorImages || []).find((c) => c.image)?.image || null);
    // Reflect filter changes on the card; a swatch click still overrides locally until the filter changes.
    useEffect(() => { if (preferColor) { const ci = colorImageOf(preferColor); if (ci) setImg(ci); } }, [preferColor]);
    const from = typeof product.priceCents === "number" && product.priceCents > 0 ? product.priceCents / 100 : null;
    const r = rating?.count > 0 ? Math.round(rating.avg) : 0;
    const showAlt = showAltView && product.altImage && product.altImage !== img;
    const swap = (e, src) => { e.preventDefault(); if (src) setImg(src); };

    // Reveal the quick-add on hover; on touch devices (no hover) keep it visible so it's reachable.
    const [hovering, setHovering] = useState(false);
    const [hoverCapable, setHoverCapable] = useState(true);
    useEffect(() => { setHoverCapable(typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches !== false); }, []);
    const showQuick = quickAdd && (hovering || !hoverCapable);

    // "All styles" modal — every blank that shares this design (carried on the card by dedupeByDesign).
    const [stylesOpen, setStylesOpen] = useState(false);
    const styleProducts = product.styleProducts || [];
    useEffect(() => {
        if (!stylesOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setStylesOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [stylesOpen]);

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
        <>
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
                {product.styleCount > 1 && (
                    <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStylesOpen(true); }}
                        title={`See all ${product.styleCount} styles`}
                        style={{ position: "absolute", left: 8, top: 8, padding: "3px 9px", borderRadius: 999, fontSize: "0.72rem", cursor: "pointer",
                            fontWeight: 600, background: "rgba(17,24,39,0.82)", color: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
                        +{product.styleCount - 1} styles
                    </span>
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

        {stylesOpen && typeof document !== "undefined" && createPortal(
            <div onClick={() => setStylesOpen(false)} role="dialog" aria-modal="true"
                style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div onClick={(e) => e.stopPropagation()}
                    style={{ background: "#fff", color: "var(--sf-text)", borderRadius: 14, maxWidth: 760, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{product.title} — {product.styleCount} styles</h3>
                        <button onClick={() => setStylesOpen(false)} aria-label="Close"
                            style={{ border: "none", background: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "inherit" }}>×</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                        {styleProducts.map((s) => (
                            <a key={s.id} href={productHref(s, urlMode)} style={{ textDecoration: "none", color: "inherit" }}>
                                <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 8, overflow: "hidden" }}>
                                    {s.image && <img src={s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </div>
                                <div style={{ marginTop: 6, fontSize: "0.85rem", fontWeight: 600 }}>{s.label}</div>
                                {typeof s.priceCents === "number" && s.priceCents > 0 && (
                                    <div style={{ fontSize: "0.82rem", color: "var(--sf-secondary)", fontWeight: 700 }}>${(s.priceCents / 100).toFixed(2)}</div>
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
}
