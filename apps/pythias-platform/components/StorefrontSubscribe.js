"use client";
import { useState } from "react";

const money = (c) => `$${(c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function StorefrontSubscribe({ plans }) {
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");

    const subscribe = async (plan) => {
        setBusy(plan); setError("");
        try {
            const d = await (await fetch("/api/storefront/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) })).json();
            if (d.url) { window.location.href = d.url; return; }
            throw new Error(d.error || "Couldn't start checkout");
        } catch (e) { setError(e.message); setBusy(""); }
    };

    return (
        <div>
            <div style={{ textAlign: "center", margin: "8px 0 18px" }}>
                <h2 style={{ margin: 0 }}>Launch your storefront</h2>
                <p style={{ color: "#64748b", margin: "4px 0 0" }}>Pick a plan to turn it on instantly. Cancel anytime.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
                {plans.map((p) => (
                    <div key={p.key} style={{ background: "#fff", border: p.popular ? "2px solid #6366f1" : "1px solid #e2e8f0", borderRadius: 14, padding: 22, position: "relative", display: "flex", flexDirection: "column" }}>
                        {p.popular && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "3px 12px", borderRadius: 999 }}>MOST POPULAR</span>}
                        <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: 10 }}>{p.blurb}</div>
                        <div style={{ marginBottom: 14 }}><span style={{ fontSize: "1.9rem", fontWeight: 800 }}>{money(p.monthlyCents)}</span><span style={{ color: "#94a3b8" }}>/mo</span></div>
                        <ul style={{ margin: "0 0 18px", paddingLeft: 18, color: "#475569", fontSize: "0.86rem", lineHeight: 1.7, flex: 1 }}>
                            {p.features.map((f) => <li key={f}>{f}</li>)}
                        </ul>
                        <button onClick={() => subscribe(p.key)} disabled={!!busy}
                            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: p.popular ? "#6366f1" : "#111827", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy && busy !== p.key ? 0.5 : 1 }}>
                            {busy === p.key ? "Starting…" : `Choose ${p.name}`}
                        </button>
                    </div>
                ))}
            </div>
            {error && <div style={{ textAlign: "center", color: "#dc2626", marginTop: 12, fontSize: "0.88rem" }}>{error}</div>}
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.76rem", marginTop: 14 }}>Secure checkout by Stripe. Your storefront tools unlock the moment payment succeeds.</p>
        </div>
    );
}
