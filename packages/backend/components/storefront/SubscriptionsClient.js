"use client";
import { useEffect, useState } from "react";

const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");

export default function SubscriptionsClient() {
    const [cfg, setCfg] = useState(null);
    const [subs, setSubs] = useState([]);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const [churn, setChurn] = useState(null);
    const [churnBusy, setChurnBusy] = useState(false);

    const loadChurn = async () => {
        setChurnBusy(true);
        try { const d = await (await fetch("/api/storefront/subscriptions/churn")).json(); setChurn(d.error ? { insights: [] } : d); }
        finally { setChurnBusy(false); }
    };

    useEffect(() => {
        fetch("/api/storefront/subscriptions").then((r) => r.json()).then((d) => {
            setCfg({ enabled: !!d.config?.enabled, discountPercent: d.config?.discountPercent ?? 10, intervals: d.config?.intervals?.length ? d.config.intervals : [{ label: "Every month", days: 30 }] });
            setSubs(d.subscriptions || []);
        }).catch(() => setCfg({ enabled: false, discountPercent: 10, intervals: [{ label: "Every month", days: 30 }] }));
    }, []);

    if (!cfg) return <div style={{ padding: 28, color: "#64748b" }}>Loading…</div>;
    const upd = (patch) => { setCfg((c) => ({ ...c, ...patch })); setSaved(false); };
    const setIv = (i, k, v) => upd({ intervals: cfg.intervals.map((x, j) => j === i ? { ...x, [k]: k === "days" ? Number(v) : v } : x) });
    const save = async () => { setBusy(true); try { await fetch("/api/storefront/subscriptions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) }); setSaved(true); } finally { setBusy(false); } };

    const C = { active: "#166534", paused: "#854d0e", canceled: "#991b1b" };
    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px", display: "grid", gap: 14 }}>
            <div><h1 style={{ margin: 0 }}>Subscriptions</h1><p style={{ color: "#64748b", margin: "2px 0 0" }}>Offer subscribe &amp; save — recurring orders bill automatically and route to fulfillment.</p></div>

            <div style={{ ...card, display: "grid", gap: 12 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}><input type="checkbox" checked={cfg.enabled} onChange={(e) => upd({ enabled: e.target.checked })} /> Enable subscribe &amp; save</label>
                <label style={{ fontSize: "0.82rem", color: "#64748b" }}>Discount on recurring orders (%)<input type="number" style={{ ...input, marginTop: 4, maxWidth: 120 }} value={cfg.discountPercent} onChange={(e) => upd({ discountPercent: Number(e.target.value) })} /></label>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>Delivery intervals</div>
                {cfg.intervals.map((iv, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input style={{ ...input, flex: 1 }} placeholder="Every month" value={iv.label} onChange={(e) => setIv(i, "label", e.target.value)} />
                        <input type="number" style={{ ...input, width: 100 }} value={iv.days} onChange={(e) => setIv(i, "days", e.target.value)} /><span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>days</span>
                        <button onClick={() => upd({ intervals: cfg.intervals.filter((_, j) => j !== i) })} style={{ ...ghost, color: "#dc2626" }}>×</button>
                    </div>
                ))}
                <button onClick={() => upd({ intervals: [...cfg.intervals, { label: "", days: 30 }] })} style={ghost}>+ Add interval</button>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}><button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save"}</button>{saved && <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.88rem" }}>Saved ✓</span>}</div>
            </div>

            <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "0.95rem" }}>✨ Churn risk &amp; retention</b>
                    {!churn && <button onClick={loadChurn} disabled={churnBusy} style={ghost}>{churnBusy ? "Analyzing…" : "Analyze churn"}</button>}
                </div>
                {churn && <div style={{ fontSize: "0.84rem", color: "#854d0e", margin: "6px 0" }}>{churn.atRisk || 0} subscription(s) at risk.</div>}
                {churn?.insights?.map((ins, i) => (
                    <div key={i} style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
                        <b>{ins.title}</b><div style={{ fontSize: "0.86rem", color: "#475569" }}>{ins.detail}</div>{ins.action && <div style={{ fontSize: "0.84rem", color: "#16a34a" }}>→ {ins.action}</div>}
                    </div>
                ))}
            </div>

            <div style={{ ...card }}>
                <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Active subscriptions ({subs.length})</h3>
                {subs.length === 0 ? <div style={{ color: "#94a3b8", fontSize: "0.88rem" }}>No subscriptions yet.</div> :
                    subs.map((s) => (
                        <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #f1f5f9", fontSize: "0.88rem" }}>
                            <span>{s.customerEmail} · {s.intervalLabel} · {s.items?.length || 0} item(s)</span>
                            <span><span style={{ color: C[s.status], fontWeight: 600, textTransform: "capitalize" }}>{s.status}</span>{s.status === "active" && s.nextBillingAt ? ` · next ${fmtDate(s.nextBillingAt)}` : ""} · {s.cyclesBilled}×</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}
