"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

// Free-shipping progress bar — nudges buyers toward the seller's free-shipping threshold.
function FreeShipBar({ subtotalCents }) {
    const { price: money, t } = useI18n();
    const [cfg, setCfg] = useState(null);
    useEffect(() => { fetch("/api/site/shipping").then((r) => r.json()).then(setCfg).catch(() => {}); }, []);
    if (!cfg || cfg.freeShipping || !(cfg.freeOverCents > 0)) return null;
    const remaining = cfg.freeOverCents - subtotalCents;
    const pct = Math.min(100, Math.round((subtotalCents / cfg.freeOverCents) * 100));
    return (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: "0.88rem", marginBottom: 6, color: "#166534" }}>
                {remaining > 0 ? <>Add <b>{money(remaining)}</b> more for <b>free shipping</b> 🎉</> : <>You&apos;ve unlocked <b>free shipping</b>! 🎉</>}
            </div>
            <div style={{ height: 6, background: "#dcfce7", borderRadius: 3 }}><div style={{ width: `${pct}%`, height: "100%", background: "#16a34a", borderRadius: 3 }} /></div>
        </div>
    );
}

export default function CartView() {
    const { items, savedForLater, ready, setQty, remove, saveForLater, moveToCart, removeSaved, subtotalCents, lineKey } = useCart();
    const { price: money } = useI18n();
    if (!ready) return null;

    if (!items.length && !savedForLater.length) {
        return (
            <section className="sf-container" style={{ padding: "64px 0", textAlign: "center" }}>
                <h1 style={{ marginBottom: 8 }}>Your cart is empty</h1>
                <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>← Continue shopping</a>
            </section>
        );
    }

    // Cart emptied but items saved for later.
    if (!items.length) {
        return (
            <section className="sf-container" style={{ padding: "40px 0", maxWidth: 800 }}>
                <h1 style={{ marginBottom: 8 }}>Your cart is empty</h1>
                <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>← Continue shopping</a>
                <SavedSection saved={savedForLater} moveToCart={moveToCart} removeSaved={removeSaved} lineKey={lineKey} />
            </section>
        );
    }

    return (
        <section className="sf-container" style={{ padding: "40px 0", maxWidth: 800 }}>
            <h1 style={{ marginBottom: 24 }}>Cart</h1>
            <FreeShipBar subtotalCents={subtotalCents} />
            {items.map((i) => {
                const k = lineKey(i);
                return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                            {i.image && <img src={i.image} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{i.title}</div>
                            <div style={{ fontSize: "0.82rem", opacity: 0.6 }}>{[i.color, i.size].filter(Boolean).join(" · ")}</div>
                            {i.personalization?.fields?.length > 0 && (
                                <div style={{ fontSize: "0.78rem", marginTop: 4, color: "var(--sf-secondary, #16a34a)" }}>
                                    ✏️ Personalized — {i.personalization.fields.filter((f) => f.value).map((f) => `${f.label}: “${f.value}”`).join(", ")}
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                <button onClick={() => saveForLater(k)} style={{ background: "none", border: "none", color: "var(--sf-secondary, #16a34a)", cursor: "pointer", padding: 0, fontSize: "0.8rem", fontWeight: 600 }}>Save for later</button>
                                <button onClick={() => remove(k)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>Remove</button>
                            </div>
                        </div>
                        <input type="number" min="1" max="99" value={i.qty} onChange={(e) => setQty(k, Number(e.target.value))}
                            style={{ width: 56, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)" }} />
                        <div style={{ width: 80, textAlign: "right", fontWeight: 700 }}>{money(i.priceCents * i.qty)}</div>
                    </div>
                );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>Shipping &amp; tax calculated at checkout</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>Subtotal: {money(subtotalCents)}</div>
            </div>
            <a href="/checkout" style={{ display: "block", textAlign: "center", marginTop: 24, padding: "14px", borderRadius: 10, background: "var(--sf-accent)", color: "#fff", fontWeight: 700 }}>
                Checkout
            </a>
            <SavedSection saved={savedForLater} moveToCart={moveToCart} removeSaved={removeSaved} lineKey={lineKey} />
        </section>
    );
}

function SavedSection({ saved, moveToCart, removeSaved, lineKey }) {
    const { price: money } = useI18n();
    if (!saved.length) return null;
    return (
        <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Saved for later ({saved.length})</h2>
            {saved.map((i) => {
                const k = lineKey(i);
                return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                            {i.image && <img src={i.image} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{i.title}</div>
                            <div style={{ fontSize: "0.82rem", opacity: 0.6 }}>{[i.color, i.size].filter(Boolean).join(" · ")}</div>
                            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                <button onClick={() => moveToCart(k)} style={{ background: "none", border: "none", color: "var(--sf-accent, #f59e0b)", cursor: "pointer", padding: 0, fontSize: "0.8rem", fontWeight: 600 }}>Move to cart</button>
                                <button onClick={() => removeSaved(k)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>Remove</button>
                            </div>
                        </div>
                        <div style={{ width: 80, textAlign: "right", fontWeight: 700 }}>{money(i.priceCents * (i.qty || 1))}</div>
                    </div>
                );
            })}
        </div>
    );
}
