"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "9px 15px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const input = { padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.9rem" };
const SEV = { 3: { bg: "#fee2e2", fg: "#991b1b", label: "Block" }, 2: { bg: "#fef9c3", fg: "#854d0e", label: "Review" }, 1: { bg: "#f1f5f9", fg: "#475569", label: "Watch" } };

export default function NetworkProtectionClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: "email", value: "", reason: "manual" });
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try { const d = await (await fetch("/api/storefront/network-protection")).json(); if (!d.error) setData(d); }
        catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const report = async (e) => {
        e.preventDefault();
        if (!form.value.trim()) return;
        setBusy(true); setMsg("");
        try {
            const d = await (await fetch("/api/storefront/network-protection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })).json();
            if (d.error) throw new Error(d.error);
            setMsg(d.message || "Reported."); setForm({ ...form, value: "" }); await load();
        } catch (e) { setMsg(e.message); } finally { setBusy(false); }
    };

    if (loading) return <div style={{ padding: 28 }}>Loading network protection…</div>;
    const s = data?.summary || {};
    const entries = data?.entries || [];

    return (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Network protection 🛡️</h1>
            <p style={{ color: "#64748b", margin: "2px 0 0" }}>You're protected by every other store on Pythias. Fraud and bad addresses flagged anywhere on the network are blocked on your store automatically — something no single-store platform can do.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 18 }}>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Bad actors blocked network-wide</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{s.blocklistSize ?? 0}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Fraud attempts caught</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a" }}>{s.caughtNetwork ?? 0}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Dead addresses suppressed</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{s.suppressionSize ?? 0}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>You contributed</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{s.reportedByYou ?? 0}</div></div>
            </div>

            <div style={{ ...card, marginTop: 16 }}>
                <b>Report a bad actor</b>
                <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "4px 0 12px" }}>Block a fraudulent buyer everywhere on the network. Values are stored hashed — we never keep raw emails or addresses.</p>
                <form onSubmit={report} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={input}>
                        <option value="email">Email</option><option value="phone">Phone</option><option value="address">Address + ZIP</option><option value="ip">IP</option>
                    </select>
                    <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "address" ? "123 Main St|90210" : form.type === "email" ? "buyer@email.com" : form.type} style={{ ...input, flex: 1, minWidth: 200 }} />
                    <button type="submit" disabled={busy} style={btn}>{busy ? "Reporting…" : "Block on network"}</button>
                </form>
                {msg && <div style={{ marginTop: 10, color: msg.includes("network") || msg.includes("blocklist") ? "#16a34a" : "#dc2626", fontSize: "0.86rem" }}>{msg}</div>}
            </div>

            <div style={{ ...card, marginTop: 16, overflowX: "auto" }}>
                <b>Recent network blocklist activity</b>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", marginTop: 10, minWidth: 560 }}>
                    <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th style={{ padding: "6px 8px" }}>Identity</th><th>Type</th><th>Level</th><th>Reason</th><th>Caught</th></tr></thead>
                    <tbody>
                        {entries.map((e, i) => {
                            const sv = SEV[e.severity] || SEV[2];
                            return (
                                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{e.masked}</td>
                                    <td>{e.type}</td>
                                    <td><span style={{ background: sv.bg, color: sv.fg, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{sv.label}</span></td>
                                    <td>{e.reason || "—"}</td>
                                    <td>{e.hits || 0}×</td>
                                </tr>
                            );
                        })}
                        {entries.length === 0 && <tr><td colSpan={5} style={{ padding: 14, color: "#64748b" }}>No blocklist entries yet — the network shield grows as stores report fraud.</td></tr>}
                    </tbody>
                </table>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.76rem", marginTop: 10 }}>Chargebacks automatically add the buyer to the blocklist. Hard bounces and spam complaints suppress that address network-wide to protect the shared sender reputation your emails rely on.</p>
        </div>
    );
}
