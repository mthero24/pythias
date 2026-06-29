"use client";
import { useCallback, useEffect, useState } from "react";

const BADGE = {
    active:  { bg: "#dcfce7", fg: "#166534", label: "Connected — payouts enabled" },
    pending: { bg: "#fef9c3", fg: "#854d0e", label: "Onboarding incomplete" },
    none:    { bg: "#f1f5f9", fg: "#475569", label: "Not connected" },
};

const SCHEDULES = [
    { key: "daily",   label: "Daily" },
    { key: "weekly",  label: "Weekly" },
    { key: "monthly", label: "Monthly" },
];

const money = (cents, currency = "usd") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format((cents || 0) / 100);
const fmtDate = (unix) => unix ? new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const PAYOUT_BADGE = { paid: "#166534", in_transit: "#854d0e", pending: "#854d0e", canceled: "#b91c1c", failed: "#b91c1c" };

export default function PayoutsClient() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [savingSchedule, setSavingSchedule] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const r = await fetch("/api/storefront/payouts");
            const d = await r.json();
            if (d.error) setError(d.error); else setStatus(d);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    const loadDetails = useCallback(async () => {
        setDetailsLoading(true);
        try {
            const r = await fetch("/api/storefront/payouts/details");
            const d = await r.json();
            if (!d.error) setDetails(d);
        } catch { /* non-fatal — the status card still renders */ }
        finally { setDetailsLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (status?.status === "active") loadDetails(); }, [status?.status, loadDetails]);

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

    const setSchedule = async (interval) => {
        if (interval === details?.schedule) return;
        setSavingSchedule(true); setError(null);
        try {
            const r = await fetch("/api/storefront/payouts/details", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interval }),
            });
            const d = await r.json();
            if (d.error) setError(d.error);
            else setDetails((prev) => ({ ...prev, schedule: d.schedule }));
        } catch (e) { setError(e.message); }
        finally { setSavingSchedule(false); }
    };

    const state = status?.status || "none";
    const badge = BADGE[state] || BADGE.none;

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
            <h1 style={{ margin: "0 0 6px" }}>Payouts</h1>
            <p style={{ color: "#64748b", margin: "0 0 24px" }}>
                Connect your Stripe account to get paid. Your balance from sales and paid invoices
                pays out to your bank automatically, on the schedule you choose.
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
                            You&apos;re all set. Paid invoices and sales pay out to your bank automatically.
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

                    <button onClick={() => { load(); if (status?.status === "active") loadDetails(); }} disabled={busy}
                        style={{ marginTop: 16, marginLeft: state === "active" ? 0 : 12, padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>
                        Refresh
                    </button>
                </div>
            )}

            {state === "active" && (
                <>
                    {/* Next payout */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginTop: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Next payout</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f172a" }}>
                                {detailsLoading && !details ? "…" : money(details?.available, details?.currency)}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>available now</div>
                        </div>
                        {!!details?.pending && (
                            <div>
                                <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Settling</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#475569" }}>{money(details.pending, details.currency)}</div>
                                <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>on the way</div>
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginTop: 16 }}>
                        <div style={{ color: "#0f172a", fontWeight: 600, marginBottom: 4 }}>Payout schedule</div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 12 }}>How often Stripe sends your balance to your bank.</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {SCHEDULES.map((s) => {
                                const on = details?.schedule === s.key;
                                return (
                                    <button key={s.key} onClick={() => setSchedule(s.key)} disabled={savingSchedule}
                                        style={{ flex: 1, padding: "10px 0", borderRadius: 8, fontWeight: 600, cursor: "pointer",
                                            border: on ? "2px solid #635bff" : "1px solid #cbd5e1",
                                            background: on ? "#efeefe" : "#fff", color: on ? "#4338ca" : "#475569" }}>
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* History */}
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginTop: 16 }}>
                        <div style={{ color: "#0f172a", fontWeight: 600, marginBottom: 12 }}>Payout history</div>
                        {detailsLoading && !details ? (
                            <div style={{ color: "#64748b" }}>Loading…</div>
                        ) : !details?.payouts?.length ? (
                            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No payouts yet. Your first one lands after your balance pays out.</div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                                <thead>
                                    <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                                        <th style={{ padding: "6px 0", fontWeight: 500 }}>Date</th>
                                        <th style={{ padding: "6px 0", fontWeight: 500 }}>Amount</th>
                                        <th style={{ padding: "6px 0", fontWeight: 500, textAlign: "right" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.payouts.map((p) => (
                                        <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "8px 0", color: "#475569" }}>{fmtDate(p.arrival_date)}</td>
                                            <td style={{ padding: "8px 0", color: "#0f172a", fontWeight: 600 }}>{money(p.amount, p.currency)}</td>
                                            <td style={{ padding: "8px 0", textAlign: "right", color: PAYOUT_BADGE[p.status] || "#475569", fontWeight: 600, textTransform: "capitalize" }}>{(p.status || "").replace(/_/g, " ")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {error && <div style={{ color: "#dc2626", marginTop: 16, fontSize: "0.9rem" }}>{error}</div>}
        </div>
    );
}
