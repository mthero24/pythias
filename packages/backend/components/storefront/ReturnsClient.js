"use client";
import { useCallback, useEffect, useState } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const btn = { padding: "8px 14px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" };
const ghost = { padding: "7px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem" };
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const STATUS = { requested: "#475569", approved: "#1e40af", received: "#854d0e", refunded: "#166534", credited: "#166534", exchanged: "#166534", rejected: "#991b1b", completed: "#166534" };

export default function ReturnsClient() {
    const [list, setList] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [insights, setInsights] = useState(null);
    const [insBusy, setInsBusy] = useState(false);

    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/storefront/returns")).json(); setList(d.error ? [] : d.returns); } catch { setList([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const act = async (id, action, extra = {}) => {
        setBusyId(id);
        try { const d = await (await fetch(`/api/storefront/returns/${id}/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) })).json(); if (d.error) alert(d.error); load(); }
        finally { setBusyId(null); }
    };
    const loadInsights = async () => {
        setInsBusy(true);
        try { const d = await (await fetch("/api/storefront/returns/insights")).json(); setInsights(d.error ? [] : (d.insights || [])); }
        finally { setInsBusy(false); }
    };

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Returns</h1>
            <p style={{ color: "#64748b", margin: "2px 0 18px" }}>Approve returns, then refund, issue store credit, or send a provider-routed replacement.</p>

            <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "0.95rem" }}>✨ Why are items coming back?</b>
                    {!insights && <button onClick={loadInsights} disabled={insBusy} style={ghost}>{insBusy ? "Analyzing…" : "Analyze return reasons"}</button>}
                </div>
                {insights?.map((ins, i) => (
                    <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid #f1f5f9" : "1px solid #f1f5f9", marginTop: i ? 0 : 10 }}>
                        <b>{ins.title}</b><div style={{ fontSize: "0.86rem", color: "#475569" }}>{ins.detail}</div>
                        {ins.action && <div style={{ fontSize: "0.84rem", color: "#16a34a" }}>→ {ins.action}</div>}
                    </div>
                ))}
                {insights && insights.length === 0 && <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 8 }}>Not enough returns yet.</div>}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
                {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 ? <div style={card}>No returns yet.</div> :
                    list.map((r) => (
                        <div key={r._id} style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{r.rmaNumber} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· order #{r.poNumber} · {r.resolution.replace("_", " ")}</span></div>
                                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{r.customerEmail} · {r.items?.length} item(s){r.refundCents ? ` · refunded ${money(r.refundCents)}` : r.creditCents ? ` · credited ${money(r.creditCents)}` : ""}</div>
                                </div>
                                <span style={{ color: STATUS[r.status] || "#475569", fontWeight: 700, fontSize: "0.82rem", textTransform: "capitalize" }}>{r.status}</span>
                            </div>
                            {r.items?.length > 0 && <div style={{ fontSize: "0.84rem", color: "#475569", margin: "8px 0" }}>{r.items.map((it, i) => <div key={i}>• {[it.styleCode, it.colorName, it.sizeName].filter(Boolean).join(" · ")} ×{it.qty} — {it.reason?.replace(/_/g, " ")}</div>)}</div>}
                            {r.note && <div style={{ fontSize: "0.84rem", color: "#64748b", fontStyle: "italic" }}>“{r.note}”</div>}

                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                {r.status === "requested" && <>
                                    <button onClick={() => act(r._id, "approve")} disabled={busyId === r._id} style={btn}>Approve</button>
                                    <button onClick={() => act(r._id, "reject")} disabled={busyId === r._id} style={ghost}>Reject</button>
                                </>}
                                {["approved", "received"].includes(r.status) && <>
                                    {r.status === "approved" && <button onClick={() => act(r._id, "receive")} disabled={busyId === r._id} style={ghost}>Mark received</button>}
                                    <button onClick={() => act(r._id, "refund")} disabled={busyId === r._id} style={btn}>Refund</button>
                                    <button onClick={() => act(r._id, "credit")} disabled={busyId === r._id} style={ghost}>Store credit</button>
                                    <button onClick={() => act(r._id, "exchange")} disabled={busyId === r._id} style={ghost}>Send replacement</button>
                                </>}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
