"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import { useI18n } from "@/components/i18n/I18nProvider";
import CartRecommendations from "@/components/cart/CartRecommendations";

// Slide-out cart drawer (opened by the cart button). Line items + subtotal + checkout + cross-sell.
export default function CartDrawer() {
    const { items, subtotalCents, setQty, remove, drawerOpen, closeDrawer, count, lineKey } = useCart();
    const { price: money } = useI18n();
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") closeDrawer(); };
        if (drawerOpen) { window.addEventListener("keydown", onKey); document.body.style.overflow = "hidden"; }
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [drawerOpen]); // eslint-disable-line
    if (typeof document === "undefined" || !drawerOpen) return null;

    const qBtn = { width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", fontSize: "1rem", lineHeight: 1, color: "#334155" };
    return createPortal(
        <>
            <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1400 }} />
            <div role="dialog" aria-label="Cart" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 92vw)", background: "#fff", color: "var(--sf-text)", zIndex: 1401, display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(16,24,40,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--sf-border,#eef1f5)" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Your cart{count > 0 ? ` (${count})` : ""}</span>
                    <button onClick={closeDrawer} aria-label="Close" style={{ background: "none", border: "none", fontSize: "1.6rem", lineHeight: 1, cursor: "pointer", color: "#64748b" }}>×</button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>
                    {!items.length ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--sf-muted,#64748b)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🛒</div>Your cart is empty.
                            <div style={{ marginTop: 12 }}><a href="/products" onClick={closeDrawer} style={{ color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none" }}>Continue shopping →</a></div>
                            <CartRecommendations title="Popular right now" limit={4} />
                        </div>
                    ) : (
                        <>
                            {items.map((i) => {
                                const k = lineKey(i);
                                return (
                                    <div key={k} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--sf-border,#f1f5f9)" }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                                            {i.image && <img src={i.image} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>{i.title}</div>
                                            {[i.color, i.size].filter(Boolean).length > 0 && <div style={{ fontSize: "0.78rem", color: "var(--sf-muted,#64748b)" }}>{[i.color, i.size].filter(Boolean).join(" · ")}</div>}
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                                                <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--sf-border,#e2e8f0)", borderRadius: 8, overflow: "hidden" }}>
                                                    <button onClick={() => setQty(k, (i.qty || 1) - 1)} aria-label="Decrease" style={qBtn}>−</button>
                                                    <span style={{ minWidth: 24, textAlign: "center", fontSize: "0.85rem", fontWeight: 600 }}>{i.qty}</span>
                                                    <button onClick={() => setQty(k, (i.qty || 1) + 1)} aria-label="Increase" style={qBtn}>+</button>
                                                </div>
                                                <button onClick={() => remove(k)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.78rem", padding: 0 }}>Remove</button>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap" }}>{money(i.priceCents * i.qty)}</div>
                                    </div>
                                );
                            })}
                            <CartRecommendations title="You might also like" limit={4} />
                        </>
                    )}
                </div>

                {items.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--sf-border,#eef1f5)", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ fontWeight: 600 }}>Subtotal</span>
                            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{money(subtotalCents)}</span>
                        </div>
                        <a href="/checkout" style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: 12, background: "var(--sf-accent)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Checkout</a>
                        <a href="/cart" onClick={closeDrawer} style={{ display: "block", textAlign: "center", marginTop: 10, color: "var(--sf-secondary)", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>View full cart</a>
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}
