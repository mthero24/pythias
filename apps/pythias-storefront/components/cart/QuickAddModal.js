"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";

// In-grid quick-add: a product card's "+" (for products with options) dispatches "sf:quick-add-open";
// this opens a wide "mini product page" — image carousel, title, price, description, color + size pickers,
// express wallets, add-to-cart / buy-now — so shoppers can buy without leaving the grid.
export default function QuickAddModal() {
    const { price: money } = useI18n();
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [data, setData] = useState(null);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const [err, setErr] = useState("");

    useEffect(() => {
        const h = (e) => {
            const pid = e?.detail?.productId; if (!pid) return;
            setProductId(pid); setOpen(true); setData(null); setColor(""); setSize(""); setActiveIdx(0); setErr("");
        };
        window.addEventListener("sf:quick-add-open", h);
        return () => window.removeEventListener("sf:quick-add-open", h);
    }, []);

    useEffect(() => {
        if (!open || !productId) return;
        let alive = true;
        fetch(`/api/products/${productId}/variants`).then((r) => r.json()).then((d) => {
            if (!alive) return;
            if (d.error) { setErr("Could not load options."); return; }
            setData(d); setColor(d.colors?.[0]?.name || ""); setSize(d.sizes?.[0] || ""); setActiveIdx(0);
        }).catch(() => alive && setErr("Could not load options."));
        return () => { alive = false; };
    }, [open, productId]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    if (!open) return null;
    const variants = data?.variants || [];
    const hasColors = (data?.colors?.length || 0) > 0;
    const hasSizes = (data?.sizes?.length || 0) > 0;
    const match = variants.find((v) => (!hasColors || v.color === color) && (!hasSizes || v.size === size));
    const gallery = (data?.images?.length ? data.images : [data?.image].filter(Boolean));
    const colorImg = hasColors ? data?.colors?.find((c) => c.name === color)?.image : null;
    const img = gallery[activeIdx] || colorImg || match?.image || data?.image || null;
    const close = () => setOpen(false);

    // Selecting a color jumps the carousel to that color's image (it's included in the gallery).
    const pickColor = (name) => {
        setColor(name);
        const ci = data?.colors?.find((c) => c.name === name)?.image;
        const i = ci ? gallery.indexOf(ci) : -1;
        if (i >= 0) setActiveIdx(i);
    };
    const step = (d) => gallery.length && setActiveIdx((i) => (i + d + gallery.length) % gallery.length);

    const lineItem = () => ({ productId, sku: match.sku, title: data.title, priceCents: match.priceCents, color: match.color || "", size: match.size || "", image: img });
    const addToCart = () => { if (!match) return setErr("That combination isn't available."); window.dispatchEvent(new CustomEvent("sf:add-to-cart", { detail: lineItem() })); close(); };
    const buyNow = () => { if (!match) return setErr("That combination isn't available."); window.dispatchEvent(new CustomEvent("sf:buy-now", { detail: lineItem() })); close(); };

    const arrowStyle = (side) => ({ position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%",
        border: "none", cursor: "pointer", background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 6px rgba(0,0,0,0.25)", fontSize: "1.1rem", lineHeight: 1, color: "#111" });

    return (
        <div onClick={close} role="dialog" aria-modal="true"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "var(--sf-text)", borderRadius: 16, maxWidth: 900, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,0.35)", position: "relative" }}>
                <button onClick={close} aria-label="Close" style={{ position: "absolute", top: 12, right: 14, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: "1.4rem", lineHeight: 1, cursor: "pointer", color: "#64748b", zIndex: 2, boxShadow: "0 1px 6px rgba(0,0,0,0.15)" }}>×</button>

                {!data && !err && <p style={{ opacity: 0.6, padding: 28 }}>Loading…</p>}
                {err && <p style={{ color: "#dc2626", padding: 28 }}>{err}</p>}

                {data && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 28, padding: 26 }}>
                        {/* Left — image carousel */}
                        <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                            <div style={{ position: "relative", aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 12, overflow: "hidden" }}>
                                {img && <img src={img} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                {gallery.length > 1 && (
                                    <>
                                        <button onClick={() => step(-1)} aria-label="Previous image" style={arrowStyle("left")}>‹</button>
                                        <button onClick={() => step(1)} aria-label="Next image" style={arrowStyle("right")}>›</button>
                                    </>
                                )}
                            </div>
                            {gallery.length > 1 && (
                                <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
                                    {gallery.map((src, i) => (
                                        <button key={i} onClick={() => setActiveIdx(i)} style={{ flex: "0 0 auto", width: 56, height: 56, borderRadius: 8, overflow: "hidden", cursor: "pointer", padding: 0,
                                            border: i === activeIdx ? "2px solid var(--sf-accent,#f59e0b)" : "1px solid rgba(0,0,0,0.15)", background: "#f3f4f6" }}>
                                            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right — details */}
                        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                            <h2 style={{ fontSize: "1.4rem", margin: "0 0 8px", paddingRight: 30 }}>{data.title}</h2>
                            {match?.priceCents > 0 && <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--sf-secondary)", marginBottom: 14 }}>{money(match.priceCents)}</div>}

                            {hasColors && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Color{color ? `: ${color}` : ""}</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {data.colors.map((c) => (
                                            <button key={c.name} onClick={() => pickColor(c.name)} title={c.name} style={{
                                                width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                                                border: color === c.name ? "2px solid var(--sf-accent,#f59e0b)" : "1px solid rgba(0,0,0,0.2)",
                                                background: c.hex ? c.hex : (c.image ? `#fff url(${c.image}) center/cover no-repeat` : "#ddd") }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasSizes && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Size{size ? `: ${size}` : ""}</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {data.sizes.map((s) => {
                                            const on = size === s;
                                            return <button key={s} onClick={() => setSize(s)} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.2)"}`, background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155", fontWeight: 600 }}>{s}</button>;
                                        })}
                                    </div>
                                </div>
                            )}

                            {err && <p style={{ color: "#dc2626", margin: "0 0 10px", fontSize: "0.88rem" }}>{err}</p>}

                            {match && (
                                <div style={{ marginBottom: 12 }}>
                                    <ExpressCheckout key={`${match.sku}-${match.priceCents}`} items={[{ productId, sku: match.sku, qty: 1 }]} amountCents={match.priceCents} />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={addToCart} disabled={!match} style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "1px solid var(--sf-accent,#f59e0b)", background: "#fff", color: "var(--sf-accent,#f59e0b)", fontWeight: 700, fontSize: "0.98rem", cursor: match ? "pointer" : "not-allowed", opacity: match ? 1 : 0.5 }}>
                                    {match ? "Add to cart" : "Unavailable"}
                                </button>
                                <button onClick={buyNow} disabled={!match} style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "none", background: match ? "var(--sf-accent,#f59e0b)" : "#cbd5e1", color: "#fff", fontWeight: 700, fontSize: "0.98rem", cursor: match ? "pointer" : "not-allowed" }}>
                                    Buy now
                                </button>
                            </div>

                            {data.description && (
                                <div style={{ marginTop: 18, lineHeight: 1.6, fontSize: "0.9rem", color: "var(--sf-muted, #556)", whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}>{data.description}</div>
                            )}
                            <a href={`/products/${productId}`} style={{ display: "inline-block", marginTop: 14, color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none", fontSize: "0.88rem" }}>View full details →</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
