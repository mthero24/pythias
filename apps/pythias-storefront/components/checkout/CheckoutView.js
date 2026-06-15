"use client";
import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/components/cart/CartProvider";
import { track } from "@/components/analytics/tracker";

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const authHeaders = () => {
    const t = typeof window !== "undefined" && localStorage.getItem("sf_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
};
const apiItems = (items) => items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty }));

const inputSx = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.95rem" };

export default function CheckoutView() {
    const { items, ready, clear } = useCart();
    const [form, setForm] = useState({ email: "", name: "", address1: "", address2: "", city: "", state: "", zip: "", country: "US" });
    const [totals, setTotals] = useState(null);
    const [rewards, setRewards] = useState(null);       // { balance, applied, eligible }
    const [applyRewards, setApplyRewards] = useState(true);
    const [promoInput, setPromoInput] = useState("");
    const [promoCode, setPromoCode] = useState("");     // applied code
    const [discount, setDiscount] = useState(null);     // { code, title, cents, freeShipping, error }
    const [giftInput, setGiftInput] = useState("");
    const [giftCardCode, setGiftCardCode] = useState("");
    const [giftCard, setGiftCard] = useState(null);     // { code, applied, balance, error }
    const [step, setStep] = useState("form");           // form | pay
    const [pay, setPay] = useState(null);               // { clientSecret, publishableKey }
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // When rewards are toggled off, send 0; on, omit so the server applies the max allowed.
    const redeemCents = () => (applyRewards ? undefined : 0);

    // Live totals (shipping/rewards/discount/tax come from the server).
    useEffect(() => {
        if (!ready || !items.length) return;
        fetch("/api/checkout/summary", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ items: apiItems(items), redeemCents: redeemCents(), promoCode, giftCardCode }) })
            .then((r) => r.json()).then((d) => { if (!d.error) { setTotals(d.totals); setRewards(d.rewards); setDiscount(d.discount); setGiftCard(d.giftCard); } }).catch(() => {});
    }, [ready, items, applyRewards, promoCode, giftCardCode]);

    const applyPromo = () => setPromoCode(promoInput.trim().toUpperCase());
    const applyGift = () => setGiftCardCode(giftInput.trim().toUpperCase());

    // Funnel: reaching checkout with items = begin_checkout.
    useEffect(() => { if (ready && items.length) track("begin_checkout"); }, [ready]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const stripePromise = useMemo(() => (pay?.publishableKey ? loadStripe(pay.publishableKey) : null), [pay?.publishableKey]);

    if (ready && !items.length && step === "form") {
        return <section className="sf-container" style={{ padding: "64px 0", textAlign: "center" }}><h1>Your cart is empty</h1><a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>← Shop</a></section>;
    }

    const startPayment = async () => {
        if (!form.email || !form.name || !form.address1 || !form.city) { setError("Please fill in your email, name, address, and city."); return; }
        setBusy(true); setError(null);
        try {
            const res = await fetch("/api/checkout/intent", {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ items: apiItems(items), email: form.email, shippingAddress: form, redeemCents: redeemCents(), promoCode, giftCardCode }),
            });
            const d = await res.json();
            if (d.error) { setError(typeof d.error === "string" ? d.error : "Could not start checkout"); return; }
            if (d.totals) setTotals(d.totals);   // now includes real tax (Stripe Tax, address-based)
            if (d.free) { track("purchase", { revenueCents: d.totals?.totalCents, items: apiItems(items) }); clear(); window.location.href = "/checkout/success"; return; }
            setPay({ clientSecret: d.clientSecret, publishableKey: d.publishableKey });
            setStep("pay");
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    return (
        <section className="sf-container" style={{ padding: "40px 0", maxWidth: 760, display: "grid", gridTemplateColumns: "1fr", gap: 28 }}>
            <h1 style={{ margin: 0 }}>Checkout</h1>

            {/* Order summary */}
            {totals && (
                <div style={{ background: "#f8f8f8", borderRadius: 10, padding: 16 }}>
                    <Row label="Subtotal" value={money(totals.subtotalCents)} />
                    <Row label="Shipping" value={totals.shippingCents ? money(totals.shippingCents) : "Free"} />
                    {/* Rewards redemption — only for signed-in buyers with a balance */}
                    {rewards?.eligible && rewards.balance > 0 && (
                        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: "0.95rem", cursor: "pointer" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" checked={applyRewards} onChange={(e) => setApplyRewards(e.target.checked)} />
                                Apply rewards ({money(rewards.balance)} available)
                            </span>
                            <span>{totals.rewardsApplied > 0 ? `−${money(totals.rewardsApplied)}` : "—"}</span>
                        </label>
                    )}
                    {!rewards?.eligible && (
                        <div style={{ padding: "3px 0", fontSize: "0.85rem", color: "#64748b" }}>
                            <a href="/account/login" style={{ color: "var(--sf-secondary, #16a34a)", fontWeight: 600 }}>Sign in</a> to use rewards
                        </div>
                    )}
                    {/* Promo code */}
                    <div style={{ display: "flex", gap: 8, padding: "8px 0", alignItems: "center" }}>
                        <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Promo code"
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem", textTransform: "uppercase" }} />
                        <button onClick={applyPromo} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Apply</button>
                    </div>
                    {totals.discountCents > 0 && <Row label={`Discount${totals.discountCode ? ` (${totals.discountCode})` : totals.discountTitle ? ` (${totals.discountTitle})` : ""}`} value={`−${money(totals.discountCents)}`} />}
                    {totals.freeShipping && totals.discountCents === 0 && <Row label="Free shipping" value="✓" />}
                    {discount?.error && promoCode && <div style={{ color: "#dc2626", fontSize: "0.82rem", padding: "0 0 4px" }}>That code isn’t valid.</div>}

                    {/* Gift card */}
                    <div style={{ display: "flex", gap: 8, padding: "8px 0", alignItems: "center" }}>
                        <input value={giftInput} onChange={(e) => setGiftInput(e.target.value)} placeholder="Gift card"
                            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem", textTransform: "uppercase" }} />
                        <button onClick={applyGift} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Apply</button>
                    </div>
                    {totals.giftCardApplied > 0 && <Row label={`Gift card${totals.giftCardCode ? ` (${totals.giftCardCode})` : ""}`} value={`−${money(totals.giftCardApplied)}`} />}
                    {giftCard?.error && giftCardCode && <div style={{ color: "#dc2626", fontSize: "0.82rem", padding: "0 0 4px" }}>That gift card isn’t valid.</div>}

                    {totals.taxCents > 0 && <Row label="Tax" value={money(totals.taxCents)} />}
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", marginTop: 8, paddingTop: 8 }}>
                        <Row label={<b>Total</b>} value={<b>{money(totals.totalCents)}</b>} />
                    </div>
                </div>
            )}

            {step === "form" && (
                <div style={{ display: "grid", gap: 12 }}>
                    <h3 style={{ margin: "0 0 4px" }}>Contact &amp; shipping</h3>
                    <input style={inputSx} placeholder="Email" type="email" value={form.email} onChange={set("email")} />
                    <input style={inputSx} placeholder="Full name" value={form.name} onChange={set("name")} />
                    <input style={inputSx} placeholder="Address" value={form.address1} onChange={set("address1")} />
                    <input style={inputSx} placeholder="Apt, suite (optional)" value={form.address2} onChange={set("address2")} />
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                        <input style={inputSx} placeholder="City" value={form.city} onChange={set("city")} />
                        <input style={inputSx} placeholder="State" value={form.state} onChange={set("state")} />
                        <input style={inputSx} placeholder="ZIP" value={form.zip} onChange={set("zip")} />
                    </div>
                    {error && <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}
                    <button onClick={startPayment} disabled={busy} style={{ padding: "14px", borderRadius: 10, border: "none", background: "var(--sf-accent)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                        {busy ? "…" : "Continue to payment"}
                    </button>
                </div>
            )}

            {step === "pay" && stripePromise && pay?.clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret: pay.clientSecret, appearance: { theme: "stripe" } }}>
                    <PaymentForm onPaid={() => { track("purchase", { revenueCents: totals?.totalCents, items: apiItems(items) }); clear(); window.location.href = "/checkout/success"; }} />
                </Elements>
            )}
        </section>
    );
}

function Row({ label, value }) {
    return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "0.95rem" }}><span>{label}</span><span>{value}</span></div>;
}

function PaymentForm({ onPaid }) {
    const stripe = useStripe();
    const elements = useElements();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true); setError(null);
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/checkout/success` },
            redirect: "if_required",
        });
        if (error) { setError(error.message); setBusy(false); return; }
        if (paymentIntent && paymentIntent.status === "succeeded") { onPaid(); return; }
        setBusy(false);
    };

    return (
        <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0 }}>Payment</h3>
            <PaymentElement />
            {error && <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}
            <button type="submit" disabled={!stripe || busy} style={{ padding: "14px", borderRadius: 10, border: "none", background: "var(--sf-accent)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {busy ? "Processing…" : "Pay now"}
            </button>
        </form>
    );
}
