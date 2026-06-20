"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, AddressElement, LinkAuthenticationElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PaymentMarks } from "@pythias/storefront";
import { useCart } from "@/components/cart/CartProvider";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";
import { track } from "@/components/analytics/tracker";
import { useI18n } from "@/components/i18n/I18nProvider";

const authHeaders = () => {
    const t = typeof window !== "undefined" && localStorage.getItem("sf_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
};
const apiItems = (items) => items.map((i) => (
    i.blankId
        ? { blankId: i.blankId, styleCode: i.styleCode, color: i.color, size: i.size, sku: i.sku, image: i.image, title: i.title, qty: i.qty, personalization: i.personalization, customKey: i.customKey }
        : { productId: i.productId, sku: i.sku, qty: i.qty, ...(i.personalization ? { personalization: i.personalization, customKey: i.customKey } : {}) }
));

let _stripe;
function getStripe(pk) { if (!pk) return null; if (!_stripe) _stripe = loadStripe(pk); return _stripe; }

// Countries where marketing consent must be an explicit (unchecked) opt-in: EU/EEA + UK + Switzerland
// (GDPR) and Canada (CASL). Everywhere else (e.g. US CAN-SPAM) a pre-checked box is allowed.
const STRICT_CONSENT_COUNTRIES = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH", "CA"]);

// Cap an item name so long titles don't blow out the summary; CSS ellipsis is the backstop.
const truncate = (s, n = 38) => { const v = String(s || ""); return v.length > n ? `${v.slice(0, n).trimEnd()}…` : v; };

const MOR_ENTITY = process.env.NEXT_PUBLIC_MOR_ENTITY || "Pythias Technologies LLC";

function MoRDisclosure({ storeName }) {
    return (
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.5, marginTop: 10 }}>
            Sold by <b style={{ color: "#64748b" }}>{storeName || "this store"}</b> · Merchant of Record: {MOR_ENTITY}.
            Your card statement will show <b style={{ color: "#64748b" }}>{MOR_ENTITY}</b>.
        </div>
    );
}

export default function CheckoutView({ storeName, badges = [] }) {
    const { items, ready, subtotalCents } = useCart();
    const pk = typeof window !== "undefined" ? window.__SF__?.stripePk : null;
    const currency = (typeof window !== "undefined" && window.__SF__?.currency) || "usd";
    const accent = (typeof window !== "undefined" && window.__SF__?.accent) || "#f59e0b";
    const stripePromise = useMemo(() => getStripe(pk), [pk]);

    if (!ready) return <Centered>Loading checkout…</Centered>;
    if (!items.length) return (
        <section className="sf-container" style={{ paddingTop: 64, paddingBottom: 64, textAlign: "center" }}>
            <h1>Your cart is empty</h1>
            <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>← Shop</a>
        </section>
    );
    if (!pk || !stripePromise) return <Centered>Payments aren’t set up for this store yet.</Centered>;

    const initialAmount = Math.max(50, subtotalCents || 50);
    const appearance = { theme: "stripe", variables: { colorPrimary: accent, borderRadius: "10px", fontFamily: "inherit", fontSizeBase: "15px" } };

    return (
        <section className="sf-container" style={{ paddingTop: 28, paddingBottom: 56, maxWidth: 1040 }}>
            <h1 style={{ margin: "0 0 20px" }}>Checkout</h1>
            <Elements stripe={stripePromise} options={{ mode: "payment", amount: initialAmount, currency, appearance }}>
                <CheckoutForm storeName={storeName} badges={badges} />
            </Elements>
        </section>
    );
}

function Centered({ children }) {
    return <section className="sf-container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center", color: "#64748b" }}>{children}</section>;
}

function CheckoutForm({ storeName, badges = [] }) {
    const trustBadges = (badges || []).filter((b) => b.image || b.label);
    const stripe = useStripe();
    const elements = useElements();
    const { items, addOns, subtotalCents, clear } = useCart();
    const { price: money } = useI18n();

    const [email, setEmail] = useState("");
    const [addr, setAddr] = useState(null);               // { complete, value }
    const [totals, setTotals] = useState(null);
    const [addOnsCents, setAddOnsCents] = useState(0);
    const [shipOptions, setShipOptions] = useState([]);
    const [shipsTo, setShipsTo] = useState(true);
    const [shipMethod, setShipMethod] = useState("standard");
    const [rewards, setRewards] = useState(null);
    const [applyRewards, setApplyRewards] = useState(true);
    const [promoInput, setPromoInput] = useState("");
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(null);
    const [giftInput, setGiftInput] = useState("");
    const [giftCardCode, setGiftCardCode] = useState("");
    const [giftCard, setGiftCard] = useState(null);
    const [subInfo, setSubInfo] = useState(null);
    const [subscribe, setSubscribe] = useState(null);
    const [showPromo, setShowPromo] = useState(false);
    const [notifyOptIn, setNotifyOptIn] = useState(true);    // transactional order updates (text + email)
    const [marketingOptIn, setMarketingOptIn] = useState(true);   // promotional email — default by country (below)
    const marketingTouched = useRef(false);   // once the buyer toggles it, stop auto-setting the default
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const NOTIFY_TEXT = "Text & email me order updates. Msg & data rates may apply.";
    const MKT_TEXT = "Email me deals, new products & offers. Unsubscribe anytime.";
    const consentText = () => [notifyOptIn && NOTIFY_TEXT, marketingOptIn && MKT_TEXT].filter(Boolean).join(" ");

    // Default the marketing opt-in by the buyer's country (pre-checked only where allowed), until they toggle it.
    const buyerCountry = addr?.value?.address?.country;
    useEffect(() => {
        if (marketingTouched.current || !buyerCountry) return;
        setMarketingOptIn(!STRICT_CONSENT_COUNTRIES.has(buyerCountry));
    }, [buyerCountry]);

    const redeemCents = () => (applyRewards ? undefined : 0);
    const addrForTax = () => {
        const ad = addr?.value?.address;
        return ad?.country ? { city: ad.city, state: ad.state, zip: ad.postal_code, country: ad.country } : undefined;
    };

    useEffect(() => { track("begin_checkout"); }, []);

    // Live totals — tax refines as the address is filled, total flows into the Stripe Elements amount.
    useEffect(() => {
        if (!items.length) return;
        let alive = true;
        fetch("/api/checkout/summary", {
            method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ items: apiItems(items), addOns, redeemCents: redeemCents(), promoCode, giftCardCode, subscribe: subscribe ? true : undefined, shippingAddress: addrForTax(), shippingMethod: shipMethod }),
        }).then((r) => r.json()).then((d) => {
            if (!alive || d.error) return;
            setTotals(d.totals); setAddOnsCents(d.addOnsCents || 0);
            setRewards(d.rewards); setDiscount(d.discount); setGiftCard(d.giftCard); setSubInfo(d.subscriptions);
            setShipsTo(d.shipsTo !== false);
            setShipOptions(d.shippingOptions || []);
            // Keep the selection valid as the country/options change.
            if (d.shippingOptions?.length && !d.shippingOptions.some((o) => o.id === shipMethod)) setShipMethod(d.shippingOptions[0].id);
            if (elements && d.totals?.totalCents > 0) elements.update({ amount: d.totals.totalCents });
        }).catch(() => {});
        return () => { alive = false; };
    // eslint-disable-next-line
    }, [items, addOns, applyRewards, promoCode, giftCardCode, subscribe, shipMethod, addr?.complete, JSON.stringify(addrForTax() || {})]);

    const pay = async () => {
        if (!stripe || !elements) return;
        setBusy(true); setError(null);
        try {
            const { error: se } = await elements.submit();
            if (se) { setError(se.message || "Please check your details."); setBusy(false); return; }

            const av = addr?.value, ad = av?.address || {};
            const shippingAddress = {
                name: av?.name || "", address1: ad.line1 || "", address2: ad.line2 || "",
                city: ad.city || "", state: ad.state || "", zip: ad.postal_code || "", country: ad.country || "US",
            };
            if (!email) { setError("Enter your email so we can send your receipt."); setBusy(false); return; }
            if (!shippingAddress.address1 || !shippingAddress.city) { setError("Enter your shipping address."); setBusy(false); return; }
            if (!shipsTo) { setError("Sorry — we don’t ship to your country yet."); setBusy(false); return; }

            const res = await fetch("/api/checkout/intent", {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ items: apiItems(items), addOns, email, shippingAddress, shippingMethod: shipMethod, redeemCents: redeemCents(), promoCode, giftCardCode, subscribe: subscribe || undefined, notifyOptIn, marketingOptIn, consentText: consentText(), analyticsSessionId: (typeof localStorage !== "undefined" && localStorage.getItem("sf_sid")) || undefined }),
            });
            const d = await res.json();
            if (d.error) { setError(typeof d.error === "string" ? d.error : "Could not start checkout"); setBusy(false); return; }
            if (d.totals) setTotals(d.totals);

            if (d.free) { track("purchase", { revenueCents: d.totals?.totalCents, items: apiItems(items) }); clear(); window.location.href = "/checkout/success"; return; }

            if (d.amountCents) elements.update({ amount: d.amountCents });
            const { error: confirmError } = await stripe.confirmPayment({
                elements, clientSecret: d.clientSecret,
                confirmParams: { return_url: `${window.location.origin}/checkout/success` }, redirect: "if_required",
            });
            if (confirmError) { setError(confirmError.message); setBusy(false); return; }
            track("purchase", { revenueCents: (d.totals || totals)?.totalCents, items: apiItems(items) });
            clear(); window.location.href = "/checkout/success";
        } catch (e) { setError(e.message); setBusy(false); }
    };

    const t = totals || {};
    const expressAmount = t.totalCents || subtotalCents || 0;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,380px)", gap: 32, alignItems: "start" }} className="sf-checkout-grid">
            {/* ── Left: one-screen pay form ─────────────────────────────────── */}
            <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
                {/* Express wallets first — the lowest-friction path (Apple/Google Pay, Link). */}
                <div>
                    <ExpressCheckout items={apiItems(items)} amountCents={expressAmount} addOns={addOns} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: "0.8rem", margin: "14px 0 2px" }}>
                        <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />or pay with card<span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
                    </div>
                </div>

                <Field label="Contact">
                    <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
                </Field>

                <Field label="Shipping address">
                    <AddressElement options={{ mode: "shipping", fields: { phone: "auto" }, display: { name: "full" } }}
                        onChange={(e) => setAddr({ complete: e.complete, value: e.value })} />
                </Field>

                {/* Shipping method — chosen options for the buyer's country. Blocks checkout if unsupported. */}
                {!shipsTo ? (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 16px", color: "#b91c1c", fontSize: "0.9rem" }}>
                        Sorry — we don’t ship to your country yet. Try a different address, or contact us.
                    </div>
                ) : shipOptions.length > 0 && (
                    <Field label="Shipping method">
                        <div style={{ display: "grid", gap: 8 }}>
                            {shipOptions.map((o) => {
                                const on = shipMethod === o.id;
                                return (
                                    <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${on ? "var(--sf-accent)" : "var(--sf-border,#e2e8f0)"}`, background: on ? "rgba(245,158,11,0.06)" : "#fff" }}>
                                        <input type="radio" name="shipmethod" checked={on} onChange={() => setShipMethod(o.id)} style={{ width: 16, height: 16 }} />
                                        <span style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{o.label}</span>
                                            {o.eta && <span style={{ display: "block", fontSize: "0.76rem", color: "#94a3b8" }}>{o.eta.minDays === o.eta.maxDays ? `${o.eta.minDays} business days` : `${o.eta.minDays}–${o.eta.maxDays} business days`}</span>}
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: o.amountCents === 0 ? "#16a34a" : "var(--sf-text)" }}>{o.amountCents === 0 ? "Free" : money(o.amountCents)}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </Field>
                )}

                <Field label="Payment">
                    <PaymentElement options={{ layout: "tabs" }} />
                </Field>

                {/* Communication consent — transactional updates (default on) + marketing (explicit opt-in). */}
                <div style={{ display: "grid", gap: 10, background: "#f8fafc", border: "1px solid var(--sf-border,#eef1f5)", borderRadius: 12, padding: "12px 14px" }}>
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: "0.86rem" }}>
                        <input type="checkbox" checked={notifyOptIn} onChange={(e) => setNotifyOptIn(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
                        <span>Text &amp; email me <b>order updates</b><span style={{ color: "#94a3b8" }}> — shipping &amp; delivery alerts. Msg &amp; data rates may apply.</span></span>
                    </label>
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: "0.86rem" }}>
                        <input type="checkbox" checked={marketingOptIn} onChange={(e) => { marketingTouched.current = true; setMarketingOptIn(e.target.checked); }} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
                        <span>Email me <b>deals, new products &amp; offers</b><span style={{ color: "#94a3b8" }}> — unsubscribe anytime.</span></span>
                    </label>
                </div>

                {error && <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}

                <button onClick={pay} disabled={busy || !stripe || !shipsTo} style={{ padding: "16px", borderRadius: 12, border: "none", background: "var(--sf-accent)", color: "#fff", fontWeight: 800, fontSize: "1.05rem", cursor: (busy || !shipsTo) ? "default" : "pointer", opacity: (busy || !shipsTo) ? 0.7 : 1 }}>
                    {busy ? "Processing…" : !shipsTo ? "Unavailable in your country" : t.totalCents ? `Pay ${money(t.totalCents)}` : "Pay"}
                </button>
                {/* Trust signals near the pay button — accepted methods, security, seller badges. */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 4, width: "100%", minWidth: 0 }}>
                    <PaymentMarks style={{ display: "flex", justifyContent: "center" }} />
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>🔒 Encrypted &amp; secure — payments by Stripe</div>
                    {trustBadges.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                            {trustBadges.map((b, i) => (
                                b.image
                                    ? <img key={i} src={b.image} alt={b.label || "badge"} style={{ height: 30, borderRadius: 6 }} />
                                    : <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid var(--sf-border,#e2e8f0)", borderRadius: 999, padding: "5px 11px", fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>{b.icon ? `${b.icon} ` : ""}{b.label}</span>
                            ))}
                        </div>
                    )}
                </div>
                <MoRDisclosure storeName={storeName} />
            </div>

            {/* ── Right: sticky order summary ───────────────────────────────── */}
            <aside style={{ position: "sticky", top: 16, minWidth: 0, background: "#fff", border: "1px solid var(--sf-border,#eef1f5)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 14 }}>Order summary</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                    {items.map((i, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                            <div style={{ position: "relative", width: 52, height: 52, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                                {i.image && <img src={i.image} alt={i.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                <span style={{ position: "absolute", top: -6, right: -6, background: "#64748b", color: "#fff", borderRadius: 999, minWidth: 18, height: 18, fontSize: "0.68rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{i.qty}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div title={i.title} style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truncate(i.title)}</div>
                                {[i.color, i.size].filter(Boolean).length > 0 && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{[i.color, i.size].filter(Boolean).join(" · ")}</div>}
                                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: 2 }}>{money((i.priceCents || 0) * i.qty)}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Promo + gift card collapsed by default to keep the page clean. */}
                {!showPromo
                    ? <button onClick={() => setShowPromo(true)} style={{ background: "none", border: "none", color: "var(--sf-secondary)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", padding: "2px 0", marginBottom: 8 }}>Have a promo or gift card?</button>
                    : (
                        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                            <CodeRow value={promoInput} setValue={setPromoInput} onApply={() => setPromoCode(promoInput.trim().toUpperCase())} placeholder="Promo code" />
                            {discount?.error && promoCode && <div style={{ color: "#dc2626", fontSize: "0.78rem" }}>That code isn’t valid.</div>}
                            <CodeRow value={giftInput} setValue={setGiftInput} onApply={() => setGiftCardCode(giftInput.trim().toUpperCase())} placeholder="Gift card" />
                            {giftCard?.error && giftCardCode && <div style={{ color: "#dc2626", fontSize: "0.78rem" }}>That gift card isn’t valid.</div>}
                        </div>
                    )}

                {/* Rewards (signed-in) */}
                {rewards?.eligible && rewards.balance > 0 && (
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: "0.88rem", cursor: "pointer" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" checked={applyRewards} onChange={(e) => setApplyRewards(e.target.checked)} />
                            Apply rewards ({money(rewards.balance)})
                        </span>
                        <span>{t.rewardsApplied > 0 ? `−${money(t.rewardsApplied)}` : "—"}</span>
                    </label>
                )}
                {/* Subscribe & save (signed-in) */}
                {subInfo?.enabled && rewards?.eligible && (
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", padding: "4px 0" }}>
                        <input type="checkbox" checked={!!subscribe} onChange={(e) => setSubscribe(e.target.checked ? { intervalDays: subInfo.intervals?.[0]?.days || 30, intervalLabel: subInfo.intervals?.[0]?.label || "Every month" } : null)} />
                        Subscribe &amp; save {subInfo.discountPercent}%
                    </label>
                )}

                <div style={{ borderTop: "1px solid var(--sf-border,#eef1f5)", marginTop: 10, paddingTop: 10, display: "grid", gap: 5 }}>
                    <Row label="Subtotal" value={money(Math.max(0, (t.subtotalCents || 0) - addOnsCents))} />
                    {addOnsCents > 0 && <Row label="Gift add-ons" value={money(addOnsCents)} />}
                    {t.discountCents > 0 && <Row label={t.discountTitle || (t.discountCode ? `Discount (${t.discountCode})` : "Discount")} value={`−${money(t.discountCents)}`} />}
                    {t.giftCardApplied > 0 && <Row label="Gift card" value={`−${money(t.giftCardApplied)}`} />}
                    <Row label="Shipping" value={t.shippingCents ? money(t.shippingCents) : <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>} />
                    <Row label="Tax" value={t.taxCents > 0 ? money(t.taxCents) : <span style={{ color: "#94a3b8" }}>Calculated at address</span>} />
                    <div style={{ borderTop: "1px solid var(--sf-border,#eef1f5)", marginTop: 6, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <b>Total</b><b style={{ fontSize: "1.3rem" }}>{money(t.totalCents || 0)}</b>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14, fontSize: "0.76rem", color: "#94a3b8" }}>
                    <span>🔒 Secure checkout</span><span>↩️ Easy returns</span>
                </div>
            </aside>

            <style>{`@media (max-width: 800px){ .sf-checkout-grid{ grid-template-columns: 1fr !important; } .sf-checkout-grid aside{ position: static !important; order: -1; } }`}</style>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8 }}>{label}</div>
            {children}
        </div>
    );
}

function CodeRow({ value, setValue, onApply, placeholder }) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
                style={{ flex: 1, padding: "9px 11px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem", textTransform: "uppercase" }} />
            <button onClick={onApply} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Apply</button>
        </div>
    );
}

function Row({ label, value }) {
    return <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}><span style={{ color: "#64748b" }}>{label}</span><span>{value}</span></div>;
}
