"use client";
import { useEffect, useState } from "react";

export default function PaySuccess() {
    const [state, setState] = useState({ loading: true });

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        const t = p.get("t"), sessionId = p.get("session_id");
        if (!t || !sessionId) { setState({ loading: false, error: "This link is missing payment details." }); return; }
        fetch("/api/pay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ t, sessionId }),
        })
            .then((r) => r.json())
            .then((d) => setState({ loading: false, ...d }))
            .catch(() => setState({ loading: false, error: "We couldn't confirm your payment. If you were charged, it will still be recorded." }));
    }, []);

    const wrap = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "Arial, sans-serif", padding: 24 };
    const card = { maxWidth: 460, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", textAlign: "center" };
    const head = { background: "#111827", padding: "20px 32px" };

    let body;
    if (state.loading) {
        body = <p style={{ color: "#6b7280", padding: "40px 32px", margin: 0 }}>Confirming your payment…</p>;
    } else if (state.paid) {
        body = (
            <div style={{ padding: "36px 32px" }}>
                <div style={{ fontSize: 48 }}>✅</div>
                <h1 style={{ color: "#111827", fontSize: 22, margin: "12px 0 8px" }}>Payment received</h1>
                <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Thank you! Your order {state.poNumber ? `#${state.poNumber}` : ""} is paid and now in production.</p>
            </div>
        );
    } else if (state.error) {
        body = (
            <div style={{ padding: "36px 32px" }}>
                <h1 style={{ color: "#111827", fontSize: 20, margin: "0 0 8px" }}>Hmm…</h1>
                <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>{state.error}</p>
            </div>
        );
    } else {
        body = (
            <div style={{ padding: "36px 32px" }}>
                <h1 style={{ color: "#111827", fontSize: 20, margin: "0 0 8px" }}>Payment pending</h1>
                <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Your payment hasn&apos;t completed yet. If you just paid, refresh this page in a moment.</p>
            </div>
        );
    }

    return (
        <div style={wrap}>
            <div style={card}>
                <div style={head}><span style={{ color: "#D3A73D", fontSize: 18, fontWeight: 700 }}>{state.brandName || "Pythias"}</span></div>
                {body}
                <div style={{ background: "#f9fafb", padding: "14px 32px", borderTop: "1px solid #e5e7eb" }}>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>Secure payment powered by Stripe</span>
                </div>
            </div>
        </div>
    );
}
