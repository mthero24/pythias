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
                <div><h1 style={{ margin: 0 }}>A/B testing</h1><p style={{ color: "#64748b", margin: "2px 0 0" }}>Test your signup popup, page sections, or a sale offer. Visitors are split evenly and the winner can be applied in one click.</p></div>
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

const TYPES = [
    { key: "popup", label: "Signup popup", blurb: "Test the popup headline, body, and button." },
    { key: "section", label: "Page section", blurb: "Test a section's copy, headline, or button against a variation." },
    { key: "sale", label: "Sale offer", blurb: "Test which sale message converts best (shown in the top bar)." },
];

function Composer({ onDone, onCancel }) {
    const [type, setType] = useState("popup");
    const [name, setName] = useState("");
    // popup overrides
    const [popup, setPopup] = useState({ headline: "", body: "", buttonText: "" });
    // sale offer
    const [sale, setSale] = useState({ message: "", code: "", bg: "", fg: "" });
    // section test
    const [pages, setPages] = useState(null);
    const [pageSlug, setPageSlug] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [secVals, setSecVals] = useState({});   // {fieldKey: variant-B value}
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (type !== "section" || pages !== null) return;
        fetch("/api/storefront/experiments/targets").then((r) => r.json()).then((d) => setPages(d.error ? [] : d.pages || [])).catch(() => setPages([]));
    }, [type, pages]);

    const curPage = (pages || []).find((p) => p.slug === pageSlug);
    const curSection = curPage?.sections.find((s) => s.id === sectionId);

    const aiSuggest = async () => {
        setAiBusy(true); setError(null);
        const goal = type === "sale" ? "more sales / higher conversion" : type === "section" ? "a higher-converting section" : "more signups";
        try {
            const d = await (await fetch("/api/storefront/experiments/ai-variant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, goal }) })).json();
            if (d.error) throw new Error(d.error);
            const c = d.config || {};
            if (type === "popup") setPopup({ headline: c.headline || "", body: c.body || "", buttonText: c.buttonText || "" });
            else if (type === "sale") setSale((s) => ({ ...s, message: c.message || "", code: c.code || s.code }));
            else if (type === "section" && curSection) {
                const next = {};
                for (const f of curSection.fields) if (c[f.key] != null) next[f.key] = c[f.key];
                setSecVals((s) => ({ ...s, ...next }));
            }
        } catch (e) { setError(e.message); } finally { setAiBusy(false); }
    };

    const create = async () => {
        if (!name) { setError("Name your test."); return; }
        let payload;
        if (type === "popup") {
            if (!popup.headline && !popup.body && !popup.buttonText) { setError("Give variant B at least one override."); return; }
            payload = { name, type, variants: [{ key: "A", label: "Control (current popup)", weightPct: 50, config: {} }, { key: "B", label: "Variant", weightPct: 50, config: popup }] };
        } else if (type === "sale") {
            if (!sale.message) { setError("Enter the sale message for variant B."); return; }
            payload = { name, type, variants: [{ key: "A", label: "Control (no sale bar)", weightPct: 50, config: {} }, { key: "B", label: "Sale offer", weightPct: 50, config: sale }] };
        } else {
            if (!sectionId) { setError("Pick a section to test."); return; }
            const cfg = {};
            for (const f of (curSection?.fields || [])) if ((secVals[f.key] ?? "") !== "") cfg[f.key] = secVals[f.key];
            if (!Object.keys(cfg).length) { setError("Change at least one field for variant B."); return; }
            payload = { name, type, target: { pageSlug, sectionId }, variants: [{ key: "A", label: "Control (current)", weightPct: 50, config: {} }, { key: "B", label: "Variant", weightPct: 50, config: cfg }] };
        }
        setBusy(true); setError(null);
        try { const d = await (await fetch("/api/storefront/experiments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json(); if (d.error) throw new Error(d.error); onDone(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };

    const aiLabel = aiBusy ? "…" : "✨ AI suggest";
    return (
        <div style={{ ...card, marginTop: 14, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>New A/B test</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TYPES.map((t) => (
                    <button key={t.key} onClick={() => { setType(t.key); setError(null); }} style={{ ...ghost, ...(type === t.key ? { borderColor: "#635bff", color: "#635bff", background: "#f5f3ff" } : {}) }}>{t.label}</button>
                ))}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: -2 }}>{TYPES.find((t) => t.key === type)?.blurb}</div>
            <input style={input} placeholder="Test name (internal)" value={name} onChange={(e) => setName(e.target.value)} />

            {type === "section" && (
                <div style={{ display: "grid", gap: 8 }}>
                    {pages === null ? <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading sections…</div>
                        : pages.length === 0 ? <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No testable sections found. Add sections to a page first.</div>
                        : <>
                            <select style={input} value={pageSlug} onChange={(e) => { setPageSlug(e.target.value); setSectionId(""); setSecVals({}); }}>
                                <option value="">Choose a page…</option>
                                {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                            </select>
                            {curPage && (
                                <select style={input} value={sectionId} onChange={(e) => { setSectionId(e.target.value); setSecVals({}); }}>
                                    <option value="">Choose a section…</option>
                                    {curPage.sections.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.type}{s.fields[0]?.value ? ` — "${String(s.fields[0].value).slice(0, 30)}"` : ""}</option>)}
                                </select>
                            )}
                        </>}
                </div>
            )}

            {((type === "section" && curSection) || type !== "section") && (
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <b style={{ fontSize: "0.86rem" }}>Variant B {type === "sale" ? "(the offer)" : type === "section" ? "(your variation)" : ""}</b>
                        <button onClick={aiSuggest} disabled={aiBusy || (type === "section" && !curSection)} style={ghost}>{aiLabel}</button>
                    </div>

                    {type === "popup" && <>
                        <input style={input} placeholder="Headline" value={popup.headline} onChange={(e) => setPopup((s) => ({ ...s, headline: e.target.value }))} />
                        <input style={input} placeholder="Body" value={popup.body} onChange={(e) => setPopup((s) => ({ ...s, body: e.target.value }))} />
                        <input style={input} placeholder="Button text" value={popup.buttonText} onChange={(e) => setPopup((s) => ({ ...s, buttonText: e.target.value }))} />
                    </>}

                    {type === "sale" && <>
                        <input style={input} placeholder="Sale message (e.g. Summer Sale — 20% off everything)" value={sale.message} onChange={(e) => setSale((s) => ({ ...s, message: e.target.value }))} />
                        <input style={input} placeholder="Promo code to show (optional)" value={sale.code} onChange={(e) => setSale((s) => ({ ...s, code: e.target.value }))} />
                        <div style={{ display: "flex", gap: 8 }}>
                            <label style={{ flex: 1, fontSize: "0.78rem", color: "#64748b" }}>Bar color<input type="color" value={sale.bg || "#f59e0b"} onChange={(e) => setSale((s) => ({ ...s, bg: e.target.value }))} style={{ width: "100%", height: 34, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff" }} /></label>
                            <label style={{ flex: 1, fontSize: "0.78rem", color: "#64748b" }}>Text color<input type="color" value={sale.fg || "#ffffff"} onChange={(e) => setSale((s) => ({ ...s, fg: e.target.value }))} style={{ width: "100%", height: 34, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff" }} /></label>
                        </div>
                    </>}

                    {type === "section" && curSection && curSection.fields.map((f) => (
                        <div key={f.key} style={{ display: "grid", gap: 3 }}>
                            <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>{f.label}{f.value ? ` · now: "${String(f.value).slice(0, 50)}"` : ""}</div>
                            <input style={input} placeholder={`New ${f.label.toLowerCase()} (leave blank to keep current)`} value={secVals[f.key] ?? ""} onChange={(e) => setSecVals((s) => ({ ...s, [f.key]: e.target.value }))} />
                        </div>
                    ))}
                </div>
            )}

            {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}><button onClick={create} disabled={busy} style={btn}>{busy ? "Starting…" : "Start test"}</button><button onClick={onCancel} style={ghost}>Cancel</button></div>
        </div>
    );
}
