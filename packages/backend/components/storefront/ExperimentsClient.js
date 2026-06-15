"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const btn = { padding: "9px 15px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" };
const ghost = { padding: "7px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem" };

// Normal CDF (Abramowitz–Stegun) → two-proportion z-test confidence between the top 2 variants.
function normCdf(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function significance(results) {
    const top = [...results].sort((a, b) => b.convRate - a.convRate);
    const [a, b] = top;
    if (!a || !b) return null;
    if (a.exposures < 30 || b.exposures < 30) return { text: "Gather more data for a confident result.", color: "#94a3b8" };
    const nA = a.exposures, nB = b.exposures, p = (a.conversions + b.conversions) / (nA + nB);
    const se = Math.sqrt(p * (1 - p) * (1 / nA + 1 / nB));
    if (!se) return { text: "Gather more data.", color: "#94a3b8" };
    const z = Math.abs((a.conversions / nA) - (b.conversions / nB)) / se;
    const conf = Math.round((2 * normCdf(z) - 1) * 100);
    if (conf >= 95) return { text: `🏆 Variant ${a.key} is winning with ${conf}% confidence.`, color: "#16a34a" };
    if (conf >= 80) return { text: `Variant ${a.key} leads (${conf}% confidence) — keep running.`, color: "#d97706" };
    return { text: `No clear winner yet (${conf}% confidence).`, color: "#94a3b8" };
}

export default function ExperimentsClient() {
    const [list, setList] = useState(null);
    const [composing, setComposing] = useState(false);
    const load = useCallback(async () => { try { const d = await (await fetch("/api/storefront/experiments")).json(); setList(d.error ? [] : d.experiments); } catch { setList([]); } }, []);
    useEffect(() => { load(); }, [load]);

    const promote = async (id, variant) => { if (!confirm(`Promote variant ${variant} as the winner? This stops the test and applies it live.`)) return; await fetch(`/api/storefront/experiments/${id}/promote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variant }) }); load(); };
    const stop = async (id) => { await fetch(`/api/storefront/experiments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "stopped" }) }); load(); };
    const del = async (id) => { if (!confirm("Delete this experiment?")) return; await fetch(`/api/storefront/experiments/${id}`, { method: "DELETE" }); load(); };

    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div><h1 style={{ margin: 0 }}>A/B testing</h1><p style={{ color: "#64748b", margin: "2px 0 0" }}>Test variations of your signup popup. Visitors are split evenly; the winner can be applied in one click.</p></div>
                <button onClick={() => setComposing(true)} style={btn}>New test</button>
            </div>

            {composing && <Composer onDone={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />}

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 && !composing ? <div style={card}>No experiments yet.</div> :
                    list.map((e) => {
                        const lead = [...(e.results || [])].sort((a, b) => b.convRate - a.convRate)[0];
                        return (
                            <div key={e._id} style={card}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                    <div><b>{e.name}</b> <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· {e.type} · <span style={{ color: e.status === "running" ? "#16a34a" : "#94a3b8" }}>{e.status}</span>{e.winner ? ` · winner ${e.winner}` : ""}</span></div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {e.status === "running" && <button onClick={() => stop(e._id)} style={ghost}>Stop</button>}
                                        <button onClick={() => del(e._id)} style={{ ...ghost, color: "#dc2626" }}>Delete</button>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                                    {(e.results || []).map((r) => {
                                        const leading = lead && r.key === lead.key && lead.exposures > 0;
                                        return (
                                            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, background: leading ? "#f0fdf4" : "#f8fafc" }}>
                                                <b style={{ width: 24 }}>{r.key}</b>
                                                <div style={{ flex: 1, fontSize: "0.85rem" }}>{r.label || (r.key === "A" ? "Control" : "Variant")}</div>
                                                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{r.exposures} seen · {r.conversions} conv</div>
                                                <div style={{ fontWeight: 800, color: leading ? "#16a34a" : "#334155", width: 60, textAlign: "right" }}>{r.convRate}%</div>
                                                {e.status === "running" && <button onClick={() => promote(e._id, r.key)} style={ghost}>Promote</button>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {(() => { const sig = significance(e.results || []); return sig ? <div style={{ marginTop: 8, fontSize: "0.82rem", fontWeight: 600, color: sig.color }}>{sig.text}</div> : null; })()}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function Composer({ onDone, onCancel }) {
    const [name, setName] = useState("");
    const [b, setB] = useState({ headline: "", body: "", buttonText: "" });
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const aiVariant = async () => {
        setAiBusy(true); setError(null);
        try { const d = await (await fetch("/api/storefront/experiments/ai-variant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "popup", goal: "more signups" }) })).json(); if (d.error) throw new Error(d.error); setB({ headline: d.config.headline || "", body: d.config.body || "", buttonText: d.config.buttonText || "" }); }
        catch (e) { setError(e.message); } finally { setAiBusy(false); }
    };
    const create = async () => {
        if (!name) { setError("Name your test."); return; }
        if (!b.headline && !b.body && !b.buttonText) { setError("Give variant B at least one override."); return; }
        setBusy(true); setError(null);
        const variants = [{ key: "A", label: "Control (current popup)", weightPct: 50, config: {} }, { key: "B", label: "Variant", weightPct: 50, config: b }];
        try { const d = await (await fetch("/api/storefront/experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type: "popup", variants }) })).json(); if (d.error) throw new Error(d.error); onDone(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };

    return (
        <div style={{ ...card, marginTop: 14, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>New popup A/B test</h3>
            <input style={input} placeholder="Test name (internal)" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Variant A is your current live popup. Define Variant B to test against it:</div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b style={{ fontSize: "0.86rem" }}>Variant B</b><button onClick={aiVariant} disabled={aiBusy} style={ghost}>{aiBusy ? "…" : "✨ AI suggest"}</button></div>
                <input style={input} placeholder="Headline" value={b.headline} onChange={(e) => setB((s) => ({ ...s, headline: e.target.value }))} />
                <input style={input} placeholder="Body" value={b.body} onChange={(e) => setB((s) => ({ ...s, body: e.target.value }))} />
                <input style={input} placeholder="Button text" value={b.buttonText} onChange={(e) => setB((s) => ({ ...s, buttonText: e.target.value }))} />
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}><button onClick={create} disabled={busy} style={btn}>{busy ? "Starting…" : "Start test"}</button><button onClick={onCancel} style={ghost}>Cancel</button></div>
        </div>
    );
}
