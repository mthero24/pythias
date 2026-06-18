"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";

// In-grid quick-add: a product card's "+" (for products with options) dispatches "sf:quick-add-open";
// this fetches the variants, lets the shopper pick color + size, then adds (via sf:add-to-cart, which
// also pops the confirmation modal when enabled). The alternative to opening the full product page.
export default function QuickAddModal() {
    const { price: money } = useI18n();
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [data, setData] = useState(null);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        const h = (e) => {
            const pid = e?.detail?.productId; if (!pid) return;
            setProductId(pid); setOpen(true); setData(null); setColor(""); setSize(""); setErr("");
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
            setData(d); setColor(d.colors?.[0]?.name || ""); setSize(d.sizes?.[0] || "");
        }).catch(() => alive && setErr("Could not load options."));
        return () => { alive = false; };
    }, [open, productId]);

    if (!open) return null;
    const variants = data?.variants || [];
    const hasColors = (data?.colors?.length || 0) > 0;
    const hasSizes = (data?.sizes?.length || 0) > 0;
    const match = variants.find((v) => (!hasColors || v.color === color) && (!hasSizes || v.size === size));
    const img = (hasColors && data?.colors?.find((c) => c.name === color)?.image) || match?.image || data?.image || null;
    const close = () => setOpen(false);

    const lineItem = () => ({ productId, sku: match.sku, title: data.title, priceCents: match.priceCents, color: match.color || "", size: match.size || "", image: img });
    const addToCart = () => {
        if (!match) { setErr("That combination isn't available."); return; }
        window.dispatchEvent(new CustomEvent("sf:add-to-cart", { detail: lineItem() }));
        close();
    };
    const buyNow = () => {
        if (!match) { setErr("That combination isn't available."); return; }
        window.dispatchEvent(new CustomEvent("sf:buy-now", { detail: lineItem() }));
        close();
    };

    return (
        <div onClick={close} role="dialog" aria-modal="true"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8vh 16px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 420, width: "100%", padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontWeight: 800, flex: 1 }}>{data?.title || "Choose options"}</span>
                    <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "#64748b" }}>×</button>
                </div>

                {!data && !err && <p style={{ opacity: 0.6 }}>Loading…</p>}
                {err && <p style={{ color: "#dc2626" }}>{err}</p>}

                {data && (
                    <>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                            <div style={{ width: 88, height: 88, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                                {img && <img src={img} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            {match?.priceCents > 0 && <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--sf-secondary)" }}>{money(match.priceCents)}</div>}
                        </div>

                        {hasColors && (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Color{color ? `: ${color}` : ""}</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {data.colors.map((c) => (
                                        <button key={c.name} onClick={() => setColor(c.name)} title={c.name} style={{
                                            width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
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
                                    {data.sizes.map((s) => {
                                        const on = size === s;
                                        return <button key={s} onClick={() => setSize(s)} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.2)"}`, background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155", fontWeight: 600 }}>{s}</button>;
                                    })}
                                </div>
                            </div>
                        )}

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
                        <a href={`/products/${productId}`} style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none", fontSize: "0.88rem" }}>View full details →</a>
                    </>
                )}
            </div>
        </div>
    );
}
