"use client";
import { useCallback, useEffect, useState } from "react";

const BADGE = {
    active:  { bg: "#dcfce7", fg: "#166534", label: "Connected — payouts enabled" },
    pending: { bg: "#fef9c3", fg: "#854d0e", label: "Onboarding incomplete" },
    none:    { bg: "#f1f5f9", fg: "#475569", label: "Not connected" },
};

export default function PayoutsClient() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const r = await fetch("/api/storefront/payouts");
            const d = await r.json();
            if (d.error) setError(d.error); else setStatus(d);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const startOnboarding = async () => {
        setBusy(true); setError(null);
        try {
            const returnUrl = window.location.href.split("?")[0];   // return to this payouts page (app-agnostic)
            const r = await fetch("/api/storefront/payouts", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returnUrl }),
            });
            const d = await r.json();
            if (d.error) { setError(d.error); return; }
            window.location.href = d.url;   // hand off to Stripe-hosted onboarding
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const state = status?.status || "none";
    const badge = BADGE[state] || BADGE.none;

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
            <h1 style={{ margin: "0 0 6px" }}>Payouts</h1>
            <p style={{ color: "#64748b", margin: "0 0 24px" }}>
                Connect your Stripe account to receive your storefront sales. Pythias collects
                each order, then transfers your net — your retail minus blank cost, the Stripe
                fee, and a 1% platform fee — to your bank.
            </p>

            {loading ? (
                <div style={{ color: "#64748b" }}>Loading…</div>
            ) : (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                    <span style={{ display: "inline-block", background: badge.bg, color: badge.fg, fontWeight: 600, fontSize: "0.85rem", padding: "4px 12px", borderRadius: 999 }}>
                        {badge.label}
                    </span>

                    {state === "active" ? (
                        <p style={{ margin: "16px 0 0", color: "#475569" }}>
                            You&apos;re all set. Sales from your storefront will pay out automatically
                            when orders ship.
                        </p>
                    ) : (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ margin: "0 0 16px", color: "#475569" }}>
                                {state === "pending"
                                    ? "Stripe still needs a few details before you can be paid. Finish onboarding to enable payouts."
                                    : "You haven't connected a payout account yet."}
                            </p>
                            <button onClick={startOnboarding} disabled={busy}
                                style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                                {busy ? "…" : state === "pending" ? "Finish onboarding" : "Connect with Stripe"}
                            </button>
                        </div>
                    )}

                    <button onClick={load} disabled={busy}
                        style={{ marginTop: 16, marginLeft: state === "active" ? 0 : 12, padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>
                        Refresh status
                    </button>
                </div>
            )}

            {error && <div style={{ color: "#dc2626", marginTop: 16, fontSize: "0.9rem" }}>{error}</div>}
        </div>
    );
}
