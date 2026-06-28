"use client";
import { useState } from "react";

// "Are you overpaying?" calculator — weaponizes Pythias's no-per-order-fees edge. The buyer
// enters their volume + what their current tool charges per order and sees how much those fees
// add up to vs Pythias's flat fee. Email capture routes a qualified lead (with inputs) to
// Contact Messages + lead sequence and fires generate_lead. Honest: shows the crossover when
// per-order fees haven't yet exceeded the flat plan.

const GOLD = "#D3A73D";
const PYTHIAS_MONTHLY = 199; // Fulfillment Cloud flat, no per-order fees
const money = (n) => "$" + Math.round(n).toLocaleString();

function Slider({ label, value, set, min, max, step, fmt }) {
    return (
        <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.92rem", color: "#4b5563", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 800 }}>{fmt(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(Number(e.target.value))} style={{ width: "100%", accentColor: GOLD }} />
        </div>
    );
}

export default function FeeCalculatorSection() {
    const [orders, setOrders] = useState(1000);
    const [fee, setFee]       = useState(0.30);
    const [email, setEmail]   = useState("");
    const [done, setDone]     = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState("");

    const monthlyFees = orders * fee;
    const annualFees  = monthlyFees * 12;
    const pythiasAnnual = PYTHIAS_MONTHLY * 12;
    const annualSavings = annualFees - pythiasAnnual;
    const crossover = Math.ceil(PYTHIAS_MONTHLY / fee); // orders/mo where per-order fees = the flat plan

    async function submit(e) {
        e.preventDefault();
        if (!email.trim()) { setError("Enter your email for the comparison."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: email,
                    email,
                    message: `Fee calculator lead — ${orders} orders/mo at $${fee.toFixed(2)}/order = ${money(annualFees)}/yr in per-order fees. Pythias flat ${money(pythiasAnnual)}/yr.${annualSavings > 0 ? ` Est. savings ${money(annualSavings)}/yr.` : ` Crossover at ${crossover} orders/mo.`}`,
                    source: "fee_calculator",
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Something went wrong.");
            try { window.gtag?.("event", "generate_lead", { method: "fee_calculator" }); } catch {}
            setDone(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{ background: "#0f172a", padding: "80px 24px" }}>
            <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
                <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 0.5, fontSize: "0.8rem", textTransform: "uppercase", margin: "0 0 10px" }}>
                    No Per-Order Fees
                </p>
                <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 12px" }}>
                    Are your per-order fees taxing your growth?
                </h2>
                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 40px" }}>
                    Most order tools charge a fee on every single order — so the more you sell, the more they
                    take. Pythias is flat. See what you&apos;re really paying.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, textAlign: "left" }}>
                    {/* Inputs */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 26px" }}>
                        <Slider label="Orders per month" value={orders} set={setOrders} min={50} max={10000} step={50} fmt={(v) => v.toLocaleString()} />
                        <Slider label="Your current per-order fee" value={fee} set={setFee} min={0.10} max={1.50} step={0.05} fmt={(v) => "$" + v.toFixed(2)} />
                        <p style={{ fontSize: "0.74rem", color: "#9ca3af", lineHeight: 1.5, marginTop: 8 }}>
                            Per-order pricing tools (Order Desk, ShipStation tiers, many POD routers) typically charge
                            $0.20–$0.50 per order. Don&apos;t count marketplace commissions — just your software&apos;s per-order fee.
                        </p>
                    </div>

                    {/* Results */}
                    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #2a2418)", borderRadius: 16, padding: "28px 26px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", margin: "0 0 4px" }}>Your per-order fees</p>
                        <div style={{ fontSize: "2.6rem", fontWeight: 800, color: GOLD, lineHeight: 1.1 }}>{money(annualFees)}<span style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}> / year</span></div>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", margin: "10px 0 0" }}>
                            Pythias: <strong style={{ color: "#fff" }}>$199/mo flat · $0 per order</strong>
                        </p>
                        <p style={{ fontSize: "1.05rem", fontWeight: 700, margin: "8px 0 16px", color: annualSavings > 0 ? "#4ade80" : "rgba(255,255,255,0.85)" }}>
                            {annualSavings > 0
                                ? `Switching saves ~${money(annualSavings)}/year — and every new order stays free.`
                                : `You cross into savings at ~${crossover.toLocaleString()} orders/mo. After that, growth costs you nothing extra.`}
                        </p>

                        {done ? (
                            <p style={{ color: GOLD, fontWeight: 600, margin: 0 }}>Sent! I&apos;ll follow up with your comparison. — Michael</p>
                        ) : (
                            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourshop.com" aria-label="Email" required
                                        style={{ flex: "1 1 180px", minWidth: 0, padding: "12px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.95rem", outline: "none" }} />
                                    <button type="submit" disabled={loading}
                                        style={{ padding: "12px 20px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #D3A73D, #f0c66a)", color: "#111", fontWeight: 800, fontSize: "0.95rem", whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
                                        {loading ? "Sending…" : "Send me the comparison"}
                                    </button>
                                </div>
                                {error && <p style={{ color: "#ff8a8a", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
