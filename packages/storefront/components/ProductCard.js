"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { productHref } from "../lib/url";
import { cfImg } from "../lib/cfImage";

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
    // Store-wide automatic discount (display-only; published to window.__SF__ by SiteScripts). Checkout
    // re-applies it once, so we adjust only the DISPLAYED price — never the price added to cart.
    const [autoPct, setAutoPct] = useState(0);
    useEffect(() => { try { const d = window.__SF__?.autoDiscount; if (d?.type === "percent" && d.value > 0) setAutoPct(Math.min(100, d.value)); } catch { /* ignore */ } }, []);
    const baseCents = typeof product.priceCents === "number" && product.priceCents > 0 ? product.priceCents : 0;
    const saleCompareCents = product.onSale && product.compareAtCents > baseCents ? product.compareAtCents : 0;
    const dispCents = autoPct > 0 && baseCents > 0 ? Math.round(baseCents * (1 - autoPct / 100)) : baseCents;
    const compareCents = saleCompareCents || (autoPct > 0 && baseCents > 0 ? baseCents : 0);
    const from = dispCents > 0 ? dispCents / 100 : null;
    const compareAt = compareCents > dispCents ? compareCents / 100 : null;
    const savePct = compareAt ? Math.round((1 - dispCents / compareCents) * 100) : 0;
    const r = rating?.count > 0 ? Math.round(rating.avg) : 0;
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

    // Hover shows the back/alt view (desktop); the displayed image still respects swatch clicks.
    const displayed = (hovering && showAltView && product.altImage && product.altImage !== img) ? product.altImage : img;

    return (
        <>
        <a href={productHref(product, urlMode)} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
            style={{ display: "block", textDecoration: "none", color: "inherit", transition: "transform 200ms ease", transform: hovering ? "translateY(-4px)" : "none" }}>
            <div style={{ position: "relative", aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 12, overflow: "hidden",
                boxShadow: hovering ? "0 14px 30px rgba(16,24,40,0.16)" : "0 1px 3px rgba(16,24,40,0.06)", transition: "box-shadow 200ms ease" }}>
                {displayed && <img src={cfImg(displayed, 400)} alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 450ms ease", transform: hovering ? "scale(1.06)" : "scale(1)" }} />}

                {/* Top-left badges: Sale / New / styles (one priority badge + styles) */}
                <div style={{ position: "absolute", left: 8, top: 8, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    {compareAt && savePct > 0 && (
                        <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.02em", background: "#dc2626", color: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.25)" }}>SAVE {savePct}%</span>
                    )}
                    {!compareAt && product.isNew && (
                        <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.02em", background: "#0f172a", color: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.25)" }}>NEW</span>
                    )}
                    {product.styleCount > 1 && (
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStylesOpen(true); }} title={`See all ${product.styleCount} styles`}
                            style={{ border: "none", padding: "3px 9px", borderRadius: 999, fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, background: "rgba(17,24,39,0.82)", color: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
                            +{product.styleCount - 1} styles
                        </button>
                    )}
                </div>

                {/* Touch devices (no hover): keep a "more views" tap badge */}
                {!hoverCapable && showAltView && product.altImage && product.altImage !== img && (
                    <button type="button" title="More views" onClick={(e) => swap(e, product.altImage)}
                        style={{ position: "absolute", left: 8, bottom: quickAdd ? 56 : 8, width: 44, height: 44, borderRadius: 8, cursor: "pointer", padding: 0,
                            border: "2px solid #fff", boxShadow: "0 1px 6px rgba(0,0,0,0.3)", background: `#fff url(${product.altImage}) center/cover no-repeat` }} />
                )}

                {/* Quick-add: full-width CTA bar that slides up on hover (always visible on touch) */}
                {quickAdd && (
                    <button onClick={quickAddToCart} aria-label="Add to cart"
                        style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 0", border: "none", cursor: "pointer",
                            background: "rgba(17,24,39,0.92)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.01em",
                            transform: showQuick ? "translateY(0)" : "translateY(100%)", transition: "transform 200ms ease" }}>
                        {needsPicker ? "Quick add +" : "Add to cart +"}
                    </button>
                )}
            </div>

            {colorImages.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {colorImages.slice(0, 6).map((c, i) => (
                        <button type="button" key={i} title={c.name} aria-label={c.name}
                            onClick={(e) => swap(e, c.image)} onMouseEnter={() => c.image && setImg(c.image)}
                            style={{ width: 20, height: 20, borderRadius: "50%", cursor: "pointer", flexShrink: 0, padding: 0,
                                border: "1px solid rgba(0,0,0,0.2)",
                                boxShadow: img && img === c.image ? "0 0 0 2px var(--sf-accent,#f59e0b)" : "none",
                                background: c.hex ? c.hex : (c.image ? `#fff url(${cfImg(c.image, 80)}) center/cover no-repeat` : "#ddd") }} />
                    ))}
                    {colorImages.length > 6 && <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>+{colorImages.length - 6} more</span>}
                </div>
            )}

            <div style={{ marginTop: 10, fontWeight: 650, fontSize: "0.98rem", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.title}</div>
            {rating?.count > 0 && <div style={{ fontSize: "0.8rem", marginTop: 3 }}><span style={{ color: "#f59e0b" }}>{"★★★★★".slice(0, r)}{"☆☆☆☆☆".slice(0, 5 - r)}</span> <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>({rating.count})</span></div>}
            {from != null && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 7 }}>
                    {product.priceVaries && <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>From</span>}
                    <span style={{ color: compareAt ? "#dc2626" : "var(--sf-secondary)", fontWeight: 800, fontSize: "1.02rem" }}>${from.toFixed(2)}</span>
                    {compareAt && <span style={{ color: "#94a3b8", textDecoration: "line-through", fontSize: "0.85rem" }}>${compareAt.toFixed(2)}</span>}
                </div>
            )}
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
                                    {s.image && <img src={cfImg(s.image, 200)} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
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
