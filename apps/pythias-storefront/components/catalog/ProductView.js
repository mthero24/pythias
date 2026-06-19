"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";
import { track } from "@/components/analytics/tracker";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buildRenderUrl } from "@/lib/renderUrl";

// Product-page top: the same two-column "mini product page" as the quick-view modal, but full size —
// image carousel (color-driven), swatches + size buttons, quantity, express wallets, Add to cart / Buy now.
// Used for standard products; customizable (design-template) products keep their own CustomizableBuyBox.
// `images` is [{ url, color }] (color = the colorName the image belongs to, or null for shared images).
// `galleryScope`: "all" shows every image; "current" shows only the selected color's images (+ shared).
export default function ProductView({ productId, title, images = [], variants = [], siblings = [], thumbs = "bottom", galleryScope = "all", placement = null, printRender = null, designId = null, defaultColor = "" }) {
    const { add } = useCart();
    const { price: money, t } = useI18n();

    const colors = useMemo(() => [...new Map(variants.filter((v) => v.color).map((v) =>
        [v.color, { name: v.color, hex: v.hex || null, image: variants.find((x) => x.color === v.color && x.image)?.image || null }])).values()], [variants]);
    const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants]);
    const hasColors = colors.length > 0, hasSizes = sizes.length > 0;

    // Start on the product's default color (if it's an available variant color), else the first color.
    const [color, setColor] = useState(() => {
        const names = colors.map((c) => c.name);
        return (defaultColor && names.includes(defaultColor)) ? defaultColor : (colors[0]?.name || "");
    });
    const [size, setSize] = useState(sizes[0] || "");
    const [qty, setQty] = useState(1);
    const placeSpots = placement?.spots || [];
    const [placeKey, setPlaceKey] = useState(null);
    const [placeOpen, setPlaceOpen] = useState(false);   // print-location section starts collapsed
    const [activeIdx, setActiveIdx] = useState(0);
    const [added, setAdded] = useState(false);
    const [err, setErr] = useState("");
    // Hover-zoom on the main image: track the cursor as a % so the zoom pans to where you point.
    const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
    const onZoomMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
        setZoom({ on: true, x, y });
    };

    useEffect(() => { track("product_view", { productId }); }, [productId]);

    const match = useMemo(() => variants.find((v) => (!hasColors || v.color === color) && (!hasSizes || v.size === size)) ?? variants[0] ?? null, [variants, color, size, hasColors, hasSizes]);

    // Normalize images to [{url,color}] (fall back to variant images), deduped by url.
    const allImgs = useMemo(() => {
        const base = images.length ? images : variants.filter((v) => v.image).map((v) => ({ url: v.image, color: v.color || null }));
        const seen = new Set(); const out = [];
        for (const im of base) { const u = im?.url || im; if (!u || seen.has(u)) continue; seen.add(u); out.push({ url: u, color: im?.color || null, side: im?.side || null }); }
        return out;
    }, [images, variants]);

    // Carousel images for the SELECTED color: its representative image first, then color-tagged + shared
    // images. So clicking a color swatch changes the carousel to that color.
    const gallery = useMemo(() => {
        const rep = colors.find((c) => c.name === color)?.image;
        const tagged = allImgs.filter((im) => im.color === color).map((im) => im.url);
        const shared = allImgs.filter((im) => !im.color).map((im) => im.url);
        const list = [...new Set([...(rep ? [rep] : []), ...tagged, ...shared])];
        return list.length ? list : allImgs.map((im) => im.url);
    }, [allImgs, color, colors]);

    // Named print-placement cards — ONLY for single-image designs (set up by ProductDetail as printRender).
    // `spots` are the blank's REAL box keys (renderImages matches those, not generic names). The preview is
    // rendered WITHOUT colorName so it uses a valid blank image for the box (avoids the compositor's black
    // fallback when the selected color has no image for that box). Multi-location designs show no selector.
    // Render the design on a given view: reuse the current color's existing rendered image for that side and
    // add srcSide=<the design's native side> so a single-side design composites onto it (front art → back
    // box). If that view's image doesn't exist, render fresh from the blank. Native side → image as-is.
    // Render the design on a box in the CURRENT color. The route finds the blank image that HAS that box
    // (back box → back image; pocket/leftChest/center box → front image) and matches the color, then keys
    // the design art to that box. Color-reactive + handles front-derived boxes (pocket) without a separate
    // image. `side` is the blank's real box key.
    const renderSpot = (side) => printRender
        ? buildRenderUrl({ orgSlug: printRender.orgSlug, blankCode: printRender.blankCode, colorName: color, art: printRender.art, side })
        : null;

    const placementOptions = useMemo(() => {
        if (!printRender || !placeSpots.length) return [];
        const byKind = Object.fromEntries(placeSpots.map((s) => [s.kind, s]));
        const has = (kind) => !!byKind[kind];
        const r = (kind) => renderSpot(byKind[kind].key);
        const o = [];
        if (has("front")) o.push({ key: "front", label: "Front Only", desc: "Design on front", spots: [byKind.front.key], imgs: [r("front")].filter(Boolean) });
        if (has("back")) o.push({ key: "back", label: "Back Only", desc: "Design on back", spots: [byKind.back.key], imgs: [r("back")].filter(Boolean) });
        if (has("front") && has("back")) o.push({ key: "front-back", label: "Front & Back", desc: "Front + back design", spots: [byKind.front.key, byKind.back.key], imgs: [r("front"), r("back")].filter(Boolean) });
        if (has("pocket")) o.push({ key: "pocket", label: "Pocket", desc: "Left-chest pocket", spots: [byKind.pocket.key], imgs: [r("pocket")].filter(Boolean) });
        if (has("pocket") && has("back")) o.push({ key: "pocket-back", label: "Pocket & Back", desc: "Pocket + back design", spots: [byKind.pocket.key, byKind.back.key], imgs: [r("pocket"), r("back")].filter(Boolean) });
        return o;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [printRender, placeSpots, color]);

    useEffect(() => { if (placementOptions.length && !placementOptions.find((o) => o.key === placeKey)) setPlaceKey(placementOptions[0].key); }, [placementOptions]);   // eslint-disable-line
    const selectedPlacement = placementOptions.find((o) => o.key === placeKey) || null;
    const spots = selectedPlacement?.spots || [];

    // Carousel: a NON-native print location shows the chosen view(s) with the design composited on; native
    // / no choice shows the product's own color images.
    const isNative = selectedPlacement && selectedPlacement.key === printRender?.artSide;
    const viewGallery = useMemo(() => {
        if (!(printRender && selectedPlacement && !isNative)) return gallery;
        const imgs = selectedPlacement.spots.map((spotKey) => renderSpot(spotKey)).filter(Boolean);
        return imgs.length ? imgs : gallery;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gallery, printRender, selectedPlacement, isNative, color]);
    useEffect(() => { setActiveIdx(0); }, [color, placeKey]);

    const basePriceCents = match?.price ? Math.round(match.price * 100)
        : (() => { const ps = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0); return ps.length ? Math.round(Math.min(...ps) * 100) : 0; })();
    // Extra print spots beyond the first add the blank's per-spot surcharge.
    const surchargeCents = Math.max(0, spots.length - 1) * (placement?.surchargeCents || 0);
    const priceCents = basePriceCents + surchargeCents;

    const pickPlacement = (opt) => setPlaceKey(opt.key);   // carousel follows via viewGallery + reset effect
    const safeIdx = activeIdx < viewGallery.length ? activeIdx : 0;
    const img = viewGallery[safeIdx] || (hasColors && colors.find((c) => c.name === color)?.image) || match?.image || viewGallery[0] || null;
    const styleCount = siblings.length + 1;

    const pickColor = (name) => {
        setColor(name);
        if (galleryScope !== "current") {
            const ci = colors.find((c) => c.name === name)?.image;
            const i = ci ? viewGallery.indexOf(ci) : -1;
            if (i >= 0) setActiveIdx(i);
        }
    };
    const step = (d) => viewGallery.length && setActiveIdx((i) => (((i < viewGallery.length ? i : 0) + d + viewGallery.length) % viewGallery.length));

    const line = () => ({
        productId, sku: match.sku, title, priceCents, color: match.color || "", size: match.size || "", image: img,
        // Only a NON-native placement is a real customization — native keeps the product's original design map.
        ...((selectedPlacement && !isNative) ? { printLocation: selectedPlacement.label, printLocations: selectedPlacement.spots, customKey: `loc-${placeKey}` } : {}),
    });

    // Deep-link into the design studio preloaded with this product's blank, color, art and chosen spots.
    const customizeHref = `/create-your-own?product=${productId}`
        + (placement?.blankId ? `&blank=${placement.blankId}` : "")
        + (color ? `&color=${encodeURIComponent(color)}` : "")
        + (designId ? `&design=${designId}` : "")
        + (spots.length ? `&spots=${spots.join(",")}` : "");
    const addToCart = () => { if (!match) return setErr("That combination isn't available."); setErr(""); add(line(), qty); setAdded(true); setTimeout(() => setAdded(false), 2500); };
    const buyNow = () => { if (!match) return setErr("That combination isn't available."); add(line(), qty, { silent: true }); setTimeout(() => { window.location.href = "/checkout"; }, 50); };

    const arrowStyle = (side) => ({ position: "absolute", top: "50%", [side]: 10, transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%",
        border: "none", cursor: "pointer", background: "rgba(255,255,255,0.92)", boxShadow: "0 1px 8px rgba(0,0,0,0.25)", fontSize: "1.2rem", lineHeight: 1, color: "#111" });
    const qtyBtn = { width: 36, height: 36, border: "1px solid rgba(0,0,0,0.2)", background: "#fff", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 };

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
            {/* Left — image carousel. Thumbnail strip position is store-configurable (bottom/top/left/right). */}
            {(() => {
                const vertical = thumbs === "left" || thumbs === "right";
                const main = (
                    <div onMouseMove={onZoomMove} onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
                        style={{ position: "relative", aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 14, overflow: "hidden", flex: 1, minWidth: 0, cursor: zoom.on ? "zoom-in" : "default" }}>
                        {img && <img src={img} alt={title} onError={(e) => { const fb = gallery[0]; if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb; }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 120ms ease-out", transform: zoom.on ? "scale(2.2)" : "scale(1)", transformOrigin: `${zoom.x}% ${zoom.y}%` }} />}
                        {viewGallery.length > 1 && (
                            <>
                                <button onClick={() => step(-1)} aria-label="Previous image" style={arrowStyle("left")}>‹</button>
                                <button onClick={() => step(1)} aria-label="Next image" style={arrowStyle("right")}>›</button>
                            </>
                        )}
                    </div>
                );
                const strip = viewGallery.length > 1 ? (
                    <div style={vertical
                        ? { display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: "0 0 72px", minHeight: 0 }
                        : { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, minWidth: 0 }}>
                        {viewGallery.map((src, i) => (
                            <button key={i} onClick={() => setActiveIdx(i)} style={{ flex: "0 0 auto", width: 64, height: 64, borderRadius: 8, overflow: "hidden", cursor: "pointer", padding: 0,
                                border: i === activeIdx ? "2px solid var(--sf-accent,#f59e0b)" : "1px solid rgba(0,0,0,0.15)", background: "#f3f4f6" }}>
                                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </button>
                        ))}
                    </div>
                ) : null;
                const stripFirst = thumbs === "top" || thumbs === "left";
                return (
                    <div style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: vertical ? "row" : "column", gap: 12, alignItems: vertical ? "stretch" : undefined }}>
                        {stripFirst && strip}
                        {main}
                        {!stripFirst && strip}
                    </div>
                );
            })()}

            {/* Right — details */}
            <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                <h1 style={{ fontSize: "1.9rem", margin: "0 0 6px" }}>{title}</h1>
                {(colors.length > 1 || siblings.length > 0) && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.6, margin: "0 0 14px" }}>
                        {[colors.length > 1 && `${colors.length} colors`, siblings.length > 0 && `${styleCount} styles`].filter(Boolean).join(" · ")}
                    </div>
                )}
                {priceCents > 0 && <div style={{ fontWeight: 800, fontSize: "1.6rem", color: "var(--sf-secondary)", marginBottom: 18 }}>{money(priceCents)}</div>}

                {hasColors && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Color{color ? `: ${color}` : ""}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {colors.map((c) => (
                                <button key={c.name} onClick={() => pickColor(c.name)} title={c.name} style={{
                                    width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                                    border: color === c.name ? "2px solid var(--sf-accent,#f59e0b)" : "1px solid rgba(0,0,0,0.2)",
                                    background: c.hex ? c.hex : (c.image ? `#fff url(${c.image}) center/cover no-repeat` : "#ddd") }} />
                            ))}
                        </div>
                    </div>
                )}

                {hasSizes && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Size{size ? `: ${size}` : ""}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {sizes.map((s) => {
                                const on = size === s;
                                return <button key={s} onClick={() => setSize(s)} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.2)"}`, background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155", fontWeight: 600 }}>{s}</button>;
                            })}
                        </div>
                    </div>
                )}

                {siblings.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.6, marginBottom: 10 }}>Also available as</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {siblings.map((s) => (
                                <a key={s.href} href={s.href} title={s.title}
                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 6px", border: "1px solid var(--sf-border, #e5e7eb)", borderRadius: 999, textDecoration: "none", color: "var(--sf-text)", background: "#fff" }}>
                                    {s.image && <img src={s.image} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: "50%", background: "#f3f4f6" }} />}
                                    <span style={{ fontSize: "0.88rem" }}>{s.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem" }}>Qty</div>
                    <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.2)" }}>
                        <button onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Decrease quantity" style={qtyBtn}>−</button>
                        <span style={{ minWidth: 40, textAlign: "center", fontWeight: 600 }}>{qty}</span>
                        <button onClick={() => setQty((n) => Math.min(99, n + 1))} aria-label="Increase quantity" style={qtyBtn}>+</button>
                    </div>
                </div>

                {err && <div style={{ color: "#dc2626", fontSize: "0.88rem", marginBottom: 10 }}>{err}</div>}

                {match && priceCents > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <ExpressCheckout key={`${match.sku}-${priceCents}-${qty}`} items={[{ productId, sku: match.sku, qty }]} amountCents={priceCents * qty} />
                    </div>
                )}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={addToCart} disabled={!match} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "1px solid var(--sf-accent,#f59e0b)", background: "#fff", color: "var(--sf-accent,#f59e0b)", fontWeight: 700, fontSize: "1rem", cursor: match ? "pointer" : "not-allowed", opacity: match ? 1 : 0.5 }}>
                        {added ? `${t("product.added", "Added")} ✓` : t("product.addToCart", "Add to cart")}
                    </button>
                    <button onClick={buyNow} disabled={!match} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: match ? "var(--sf-accent,#f59e0b)" : "#cbd5e1", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: match ? "pointer" : "not-allowed" }}>
                        Buy now
                    </button>
                    <FavoriteHeart size={28} product={{ productId, title, image: img, priceCents, sku: match?.sku || "", color: match?.color || "", size: match?.size || "" }} />
                </div>
                {added && <a href="/cart" style={{ display: "inline-block", marginTop: 12, color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none" }}>View cart →</a>}

                <a href={customizeHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, padding: "13px 0", borderRadius: 10,
                    border: "1px dashed var(--sf-accent,#f59e0b)", color: "var(--sf-accent,#f59e0b)", fontWeight: 700, fontSize: "0.96rem", textDecoration: "none" }}>
                    🎨 Customize this design
                </a>
                <div style={{ fontSize: "0.78rem", color: "var(--sf-muted,#64748b)", marginTop: 6, textAlign: "center" }}>Open it in the design studio — add text, art, or edit with AI.</div>

                {placementOptions.length > 0 && (
                    <div style={{ marginTop: 22, borderTop: "1px solid var(--sf-border, #e5e7eb)", paddingTop: 16 }}>
                        <button onClick={() => setPlaceOpen((o) => !o)} aria-expanded={placeOpen}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--sf-text)" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Print location{selectedPlacement ? `: ${selectedPlacement.label}` : ""}</span>
                            <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{placeOpen ? "–" : "+"}</span>
                        </button>
                        {placeOpen && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))", gap: 10 }}>
                                    {placementOptions.map((opt, i) => {
                                        const on = opt.key === placeKey;
                                        const extra = i > 0 && (placement?.surchargeCents || 0) > 0;
                                        return (
                                            <button key={opt.key} onClick={() => pickPlacement(opt)} style={{ position: "relative", textAlign: "left", cursor: "pointer", padding: 8, borderRadius: 12, background: "#fff",
                                                border: on ? "2px solid var(--sf-accent,#f59e0b)" : "1px solid rgba(0,0,0,0.15)" }}>
                                                {on && <span style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>}
                                                <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center", background: "#f3f4f6", borderRadius: 8, padding: 8, marginBottom: 6, height: 84 }}>
                                                    {(opt.imgs.length ? opt.imgs : [img]).slice(0, 2).map((u, ii) => (
                                                        <img key={ii} src={u} alt="" onError={(e) => { const fb = img || match?.image; if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb; }}
                                                            style={{ width: opt.imgs.length > 1 ? "46%" : "70%", height: "100%", objectFit: "contain" }} />
                                                    ))}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>{opt.label}</div>
                                                <div style={{ fontSize: "0.72rem", color: "var(--sf-muted,#64748b)", lineHeight: 1.35 }}>{opt.desc}{extra ? ` · +${money(placement.surchargeCents)}` : ""}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {surchargeCents > 0 && <div style={{ fontSize: "0.78rem", color: "var(--sf-muted,#64748b)", marginTop: 8 }}>+{money(surchargeCents)} for the extra print location{spots.length - 1 === 1 ? "" : "s"}</div>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
