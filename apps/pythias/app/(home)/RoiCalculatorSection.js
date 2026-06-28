"use client";
import { useState } from "react";

// Interactive ROI / "cost of chaos" calculator. The buyer enters their own numbers and sees
// hours + dollars lost to manual work — the most persuasive thing in B2B. Capturing the email
// to "send the full breakdown" routes a qualified lead (with their inputs) to Contact Messages
// + the lead sequence, and fires generate_lead. Assumptions are shown for credibility.

const GOLD = "#D3A73D";
const money = (n) => "$" + Math.round(n).toLocaleString();

function Slider({ label, value, set, min, max, step, fmt }) {
    return (
        <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.92rem", color: "#4b5563", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: "0.95rem", color: "#111827", fontWeight: 800 }}>{fmt(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(Number(e.target.value))}
                style={{ width: "100%", accentColor: GOLD }} />
        </div>
    );
}

export default function RoiCalculatorSection() {
    const [orders, setOrders]     = useState(500);
    const [channels, setChannels] = useState(3);
    const [wage, setWage]         = useState(20);
    const [email, setEmail]       = useState("");
    const [done, setDone]         = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");

    // Conservative model: ~2 min of automatable manual handling per order (order entry, routing,
    // label lookup, confirmation), plus a small per-channel context-switching overhead, capped.
    // Manual error rate ~1.5% drops to ~0.3% with automation (~1.2% fewer errors), each ~$18.
    const minPerOrder = Math.min(2 + channels * 0.25, 4);
    const hoursSaved  = (orders * minPerOrder) / 60;
    const laborSaved  = hoursSaved * wage;
    const errorSaved  = orders * 0.012 * 18;
    const monthly     = laborSaved + errorSaved;
    const annual      = monthly * 12;

    async function submit(e) {
        e.preventDefault();
        if (!email.trim()) { setError("Enter your email for the full breakdown."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: email,
                    email,
                    message: `ROI calculator lead — ${orders} orders/mo, ${channels} channels, $${wage}/hr labor.\nEstimated savings: ${money(monthly)}/mo, ${money(annual)}/yr, ${Math.round(hoursSaved)} hrs/mo back.`,
                    source: "roi_calculator",
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Something went wrong.");
            try { window.gtag?.("event", "generate_lead", { method: "roi_calculator" }); } catch {}
            setDone(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{ background: "#f8faff", padding: "80px 24px" }}>
            <div style={{ maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
                <p style={{ color: GOLD, fontWeight: 700, letterSpacing: 0.5, fontSize: "0.8rem", textTransform: "uppercase", margin: "0 0 10px" }}>
                    ROI Calculator
                </p>
                <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.15, margin: "0 0 12px" }}>
                    What is the chaos costing you?
                </h2>
                <p style={{ color: "#4b5563", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 620, margin: "0 auto 40px" }}>
                    Move the sliders to your numbers and see the time and money manual order management is
                    quietly draining from your shop every month.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, textAlign: "left", alignItems: "stretch" }}>
                    {/* Inputs */}
                    <div style={{ background: "#fff", border: "1px solid #e6e9f2", borderRadius: 16, padding: "28px 26px" }}>
                        <Slider label="Orders per month" value={orders} set={setOrders} min={50} max={5000} step={50} fmt={(v) => v.toLocaleString()} />
                        <Slider label="Sales channels" value={channels} set={setChannels} min={1} max={10} step={1} fmt={(v) => v} />
                        <Slider label="Labor cost per hour" value={wage} set={setWage} min={12} max={45} step={1} fmt={(v) => "$" + v} />
                        <p style={{ fontSize: "0.74rem", color: "#9ca3af", lineHeight: 1.5, marginTop: 8 }}>
                            Based on ~2 min of manual handling saved per order (entry, routing, labels, confirmation)
                            plus a small per-channel overhead, and ~1.2% fewer errors at ~$18 each. Conservative — your real numbers may be higher.
                        </p>
                    </div>

                    {/* Results */}
                    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #2a2418)", borderRadius: 16, padding: "28px 26px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", margin: "0 0 4px" }}>You could be saving</p>
                        <div style={{ fontSize: "2.6rem", fontWeight: 800, color: GOLD, lineHeight: 1.1 }}>{money(monthly)}<span style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}> / month</span></div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 700, margin: "6px 0 16px" }}>{money(annual)} a year · {Math.round(hoursSaved)} hours/month back</div>

                        {done ? (
                            <p style={{ color: GOLD, fontWeight: 600, margin: 0 }}>
                                Sent! I&apos;ll follow up with your full breakdown. — Michael
                            </p>
                        ) : (
                            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", margin: 0 }}>Want the full breakdown + how Pythias gets you there?</p>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourshop.com" aria-label="Email" required
                                        style={{ flex: "1 1 180px", minWidth: 0, padding: "12px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.95rem", outline: "none" }} />
                                    <button type="submit" disabled={loading}
                                        style={{ padding: "12px 20px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #D3A73D, #f0c66a)", color: "#111", fontWeight: 800, fontSize: "0.95rem", whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
                                        {loading ? "Sending…" : "Email me the breakdown"}
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
