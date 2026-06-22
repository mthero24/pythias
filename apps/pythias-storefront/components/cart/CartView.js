"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useI18n } from "@/components/i18n/I18nProvider";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";
import CartRecommendations from "@/components/cart/CartRecommendations";

// Free-shipping progress bar — nudges buyers toward the seller's free-shipping threshold.
function FreeShipBar({ subtotalCents }) {
    const { price: money } = useI18n();
    const [cfg, setCfg] = useState(null);
    useEffect(() => { fetch("/api/site/shipping").then((r) => r.json()).then(setCfg).catch(() => {}); }, []);
    if (!cfg || cfg.freeShipping || !(cfg.freeOverCents > 0)) return null;
    const remaining = cfg.freeOverCents - subtotalCents;
    const pct = Math.min(100, Math.round((subtotalCents / cfg.freeOverCents) * 100));
    return (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: "0.88rem", marginBottom: 6, color: "#166534" }}>
                {remaining > 0 ? <>Add <b>{money(remaining)}</b> more for <b>free shipping</b> 🎉</> : <>You&apos;ve unlocked <b>free shipping</b>! 🎉</>}
            </div>
            <div style={{ height: 6, background: "#dcfce7", borderRadius: 3 }}><div style={{ width: `${pct}%`, height: "100%", background: "#16a34a", borderRadius: 3, transition: "width 300ms" }} /></div>
        </div>
    );
}

const stepBtn = { width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", fontSize: "1.05rem", lineHeight: 1, color: "#334155" };

export default function CartView({ addOns = [] }) {
    const { items, savedForLater, ready, setQty, remove, saveForLater, moveToCart, removeSaved, subtotalCents, lineKey, addOns: selected, setAddOn } = useCart();
    const { price: money } = useI18n();

    // Automatic discount preview — priced server-side from the cart subtotal so the buyer sees the
    // deal in the cart (shipping/tax still resolve at checkout, but the discount is known now).
    const [discount, setDiscount] = useState({ cents: 0, title: null });
    useEffect(() => {
        if (!ready || !items.length) { setDiscount({ cents: 0, title: null }); return; }
        let alive = true;
        fetch("/api/checkout/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty })), addOns: selected }) })
            .then((r) => r.json())
            .then((d) => { if (alive && !d.error) setDiscount({ cents: d.totals?.discountCents || 0, title: d.discount?.title || null }); })
            .catch(() => {});
        return () => { alive = false; };
    }, [ready, JSON.stringify(items.map((i) => [i.productId, i.sku, i.qty])), JSON.stringify(selected)]); // eslint-disable-line

    if (!ready) return null;

    if (!items.length) {
        return (
            <section className="sf-container" style={{ paddingTop: 64, paddingBottom: 64, textAlign: "center", maxWidth: 800 }}>
                <div style={{ fontSize: "3rem", marginBottom: 8 }}>🛒</div>
                <h1 style={{ marginBottom: 8 }}>Your cart is empty</h1>
                <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none" }}>← Continue shopping</a>
                <SavedSection saved={savedForLater} moveToCart={moveToCart} removeSaved={removeSaved} lineKey={lineKey} />
                <div style={{ textAlign: "left", marginTop: 8 }}><CartRecommendations title="Popular right now" limit={6} /></div>
            </section>
        );
    }

    const toggleAddOns = addOns.filter((a) => a.type !== "message");
    const messageAddOns = addOns.filter((a) => a.type === "message");
    const addOnsCents = toggleAddOns.reduce((s, a) => s + (selected[a.id] ? (a.priceCents || 0) : 0), 0);
    const totalCents = Math.max(0, subtotalCents + addOnsCents - (discount.cents || 0));
    const card = { background: "#fff", border: "1px solid var(--sf-border, #eef1f5)", borderRadius: 16 };

    return (
        <section className="sf-container" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 1080 }}>
            <style>{`@media(max-width:760px){.sf-cart-grid{gap:24px !important}.sf-cart-grid>div{flex-basis:100% !important;max-width:100% !important}.sf-cart-summary{position:static !important}}`}</style>
            <h1 style={{ marginBottom: 24 }}>Cart</h1>
            <div className="sf-cart-grid" style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start" }}>
                {/* Left — items + add-ons */}
                <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                    {/* Free-ship threshold is on the POST-discount total (matches the server) — a discount
                        can drop the order below the threshold, so the bar must use the discounted amount. */}
                    <FreeShipBar subtotalCents={totalCents} />

                    <div style={{ ...card, padding: "4px 20px" }}>
                        {items.map((i) => {
                            const k = lineKey(i);
                            return (
                                <div key={k} style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--sf-border, #eef1f5)" }}>
                                    <div style={{ width: 84, height: 84, borderRadius: 10, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                                        {i.image && <img src={i.image} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 650, lineHeight: 1.3 }}>{i.title}</div>
                                        {[i.color, i.size].filter(Boolean).length > 0 && <div style={{ fontSize: "0.82rem", color: "var(--sf-muted,#64748b)", marginTop: 2 }}>{[i.color, i.size].filter(Boolean).join(" · ")}</div>}
                                        {i.printLocation && <div style={{ fontSize: "0.78rem", color: "var(--sf-muted,#64748b)" }}>Print: {i.printLocation}</div>}
                                        {i.personalization?.fields?.length > 0 && (
                                            <div style={{ fontSize: "0.78rem", marginTop: 4, color: "var(--sf-secondary, #16a34a)" }}>
                                                ✏️ {i.personalization.fields.filter((f) => f.value).map((f) => `${f.label}: “${f.value}”`).join(", ")}
                                            </div>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                                            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--sf-border,#e2e8f0)", borderRadius: 8, overflow: "hidden" }}>
                                                <button onClick={() => setQty(k, (i.qty || 1) - 1)} aria-label="Decrease" style={stepBtn}>−</button>
                                                <span style={{ minWidth: 30, textAlign: "center", fontWeight: 600, fontSize: "0.9rem" }}>{i.qty}</span>
                                                <button onClick={() => setQty(k, (i.qty || 1) + 1)} aria-label="Increase" style={stepBtn}>+</button>
                                            </div>
                                            <button onClick={() => saveForLater(k)} style={{ background: "none", border: "none", color: "var(--sf-secondary, #16a34a)", cursor: "pointer", padding: 0, fontSize: "0.8rem", fontWeight: 600 }}>Save for later</button>
                                            <button onClick={() => remove(k)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>Remove</button>
                                        </div>
                                    </div>
                                    <div style={{ width: 84, textAlign: "right", fontWeight: 700 }}>{money(i.priceCents * i.qty)}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Optional add-ons (seller-configured) */}
                    {addOns.length > 0 && (
                        <div style={{ ...card, padding: 20, marginTop: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>🎁 Make it special</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--sf-muted,#64748b)", marginBottom: 14 }}>Optional gift touches for this order.</div>
                            {toggleAddOns.map((a) => {
                                const on = !!selected[a.id];
                                return (
                                    <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--sf-border,#f1f5f9)", cursor: "pointer" }}>
                                        <input type="checkbox" checked={on} onChange={(e) => setAddOn(a.id, e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0 }} />
                                        <span style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{a.label}</span>
                                            {a.description && <span style={{ display: "block", fontSize: "0.78rem", color: "var(--sf-muted,#64748b)" }}>{a.description}</span>}
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: a.priceCents > 0 ? "var(--sf-text)" : "#16a34a" }}>{a.priceCents > 0 ? `+${money(a.priceCents)}` : "Free"}</span>
                                    </label>
                                );
                            })}
                            {messageAddOns.map((a) => (
                                <div key={a.id} style={{ padding: "12px 0", borderTop: "1px solid var(--sf-border,#f1f5f9)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{a.label}</span>
                                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: a.priceCents > 0 ? "var(--sf-text)" : "#16a34a" }}>{a.priceCents > 0 ? `+${money(a.priceCents)}` : "Free"}</span>
                                    </div>
                                    <textarea value={typeof selected[a.id] === "string" ? selected[a.id] : ""} onChange={(e) => setAddOn(a.id, e.target.value)}
                                        placeholder={a.description || "Write your message…"} maxLength={300} rows={3}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--sf-border,#cbd5e1)", fontSize: "0.9rem", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                                </div>
                            ))}
                        </div>
                    )}

                    <SavedSection saved={savedForLater} moveToCart={moveToCart} removeSaved={removeSaved} lineKey={lineKey} />

                    <CartRecommendations title="You might also like" limit={6} />
                </div>

                {/* Right — order summary (sticky on desktop, static on mobile) */}
                <div className="sf-cart-summary" style={{ flex: "1 1 300px", maxWidth: 360, position: "sticky", top: 16 }}>
                    <div style={{ ...card, padding: 22 }}>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 16 }}>Order summary</div>
                        <Row label="Subtotal" value={money(subtotalCents)} />
                        {addOnsCents > 0 && <Row label="Gift add-ons" value={money(addOnsCents)} />}
                        {discount.cents > 0 && <Row label={discount.title || "Discount"} value={<span style={{ color: "#16a34a", fontWeight: 700 }}>−{money(discount.cents)}</span>} />}
                        <Row label="Shipping" value={<span style={{ color: "var(--sf-muted,#64748b)", fontWeight: 500 }}>At checkout</span>} />
                        <Row label="Tax" value={<span style={{ color: "var(--sf-muted,#64748b)", fontWeight: 500 }}>At checkout</span>} />
                        <div style={{ borderTop: "1px solid var(--sf-border,#eef1f5)", margin: "12px 0", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontWeight: 700 }}>Total</span>
                            <span style={{ fontWeight: 800, fontSize: "1.4rem" }}>{money(totalCents)}</span>
                        </div>
                        <a href="/checkout" style={{ display: "block", textAlign: "center", marginTop: 6, padding: "15px", borderRadius: 12, background: "var(--sf-accent)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
                            Checkout
                        </a>
                        <div style={{ marginTop: 14 }}>
                            <ExpressCheckout items={items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty }))} amountCents={totalCents} addOns={selected} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14, fontSize: "0.78rem", color: "var(--sf-muted,#64748b)" }}>
                            <span>🔒 Secure</span><span>↩️ Easy returns</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", fontSize: "0.92rem" }}>
            <span style={{ color: "var(--sf-muted,#64748b)" }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function SavedSection({ saved, moveToCart, removeSaved, lineKey }) {
    const { price: money } = useI18n();
    if (!saved.length) return null;
    return (
        <div style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>Saved for later ({saved.length})</h2>
            {saved.map((i) => {
                const k = lineKey(i);
                return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--sf-border, #eef1f5)" }}>
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
