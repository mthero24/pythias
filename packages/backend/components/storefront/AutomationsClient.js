"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };

const TRIGGERS = [["signup", "On signup"], ["first_purchase", "First purchase"], ["any_purchase", "Any purchase"], ["abandoned_cart", "Abandoned cart"], ["win_back", "Win-back (lapsed)"]];
const SEG_FIELDS = ["emailConsent", "smsConsent", "isLead", "emailVerified", "ordersCount", "totalSpentCents", "lastOrderDaysAgo", "signupDaysAgo", "rewardsBalance"];
const SEG_OPS = ["is", "gte", "lte", "eq"];

export default function AutomationsClient() {
    const [tab, setTab] = useState("flows");
    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Automations</h1>
            <p style={{ color: "#64748b", margin: "2px 0 18px" }}>Triggered email/SMS flows + reusable audience segments. Describe one and AI builds it.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[["flows", "Flows"], ["segments", "Segments"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} style={{ ...ghost, ...(tab === k ? { background: "#eef2ff", borderColor: "#635bff", color: "#635bff" } : {}) }}>{l}</button>
                ))}
            </div>
            {tab === "flows" ? <Flows /> : <Segments />}
        </div>
    );
}

// ── Flows ────────────────────────────────────────────────────────────────────
function Flows() {
    const [list, setList] = useState(null);
    const [segments, setSegments] = useState([]);
    const [editing, setEditing] = useState(null);
    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/storefront/flows")).json(); setList(d.error ? [] : d.flows); } catch { setList([]); }
        try { const s = await (await fetch("/api/storefront/segments")).json(); setSegments(s.error ? [] : s.segments); } catch { /* ignore */ }
    }, []);
    useEffect(() => { load(); }, [load]);

    if (editing) return <FlowEditor initial={editing} segments={segments} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
    const label = (t) => (TRIGGERS.find((x) => x[0] === t) || [, t])[1];
    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={() => setEditing({ name: "", trigger: "signup", active: false, steps: [{ delayHours: 0, channel: "email", subject: "", html: "" }] })} style={btn}>New flow</button></div>
            {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 ? <div style={card}>No flows yet.</div> :
                list.map((f) => (
                    <div key={f._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{f.name} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· {label(f.trigger)} · {f.steps?.length || 0} steps</span></div>
                            <div style={{ fontSize: "0.8rem", color: f.active ? "#16a34a" : "#94a3b8" }}>{f.active ? "active" : "paused"} · {f.stats?.enrolled || 0} enrolled</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={async () => { await fetch(`/api/storefront/flows/${f._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !f.active }) }); load(); }} style={ghost}>{f.active ? "Pause" : "Activate"}</button>
                            <button onClick={() => setEditing(f)} style={ghost}>Edit</button>
                        </div>
                    </div>
                ))}
        </div>
    );
}

function FlowEditor({ initial, segments, onClose, onSaved }) {
    const [f, setF] = useState({ steps: [], ...initial });
    const [prompt, setPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const setStep = (i, k, v) => setF((s) => ({ ...s, steps: s.steps.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
    const addStep = () => setF((s) => ({ ...s, steps: [...s.steps, { delayHours: 24, channel: "email", subject: "", html: "" }] }));
    const rmStep = (i) => setF((s) => ({ ...s, steps: s.steps.filter((_, j) => j !== i) }));
    const previewStep = async (st) => {
        const to = window.prompt(st.channel === "sms" ? "Send a preview text to which number? (+1…)" : "Send a preview email to which address?");
        if (!to) return;
        try {
            const d = await (await fetch("/api/marketing/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: st.channel, subject: st.subject, html: st.html, body: st.body, to }) })).json();
            alert(d.error ? `Preview failed: ${d.error}` : "Preview sent ✓");
        } catch { alert("Preview failed"); }
    };

    const aiBuild = async () => {
        if (!prompt.trim()) return; setAiBusy(true); setError(null);
        try { const d = await (await fetch("/api/storefront/flows/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })).json(); if (d.error) throw new Error(d.error); setF((s) => ({ ...s, name: d.name || s.name, trigger: d.trigger || s.trigger, steps: d.steps?.length ? d.steps : s.steps })); }
        catch (e) { setError(e.message); } finally { setAiBusy(false); }
    };
    const save = async () => {
        if (!f.name) { setError("Name required."); return; } setBusy(true); setError(null);
        const payload = { name: f.name, trigger: f.trigger, active: !!f.active, segmentId: f.segmentId || undefined, steps: f.steps };
        try { const url = f._id ? `/api/storefront/flows/${f._id}` : "/api/storefront/flows"; const d = await (await fetch(url, { method: f._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json(); if (d.error) throw new Error(d.error); onSaved(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };
    const del = async () => { if (!f._id || !confirm("Delete flow?")) return; await fetch(`/api/storefront/flows/${f._id}`, { method: "DELETE" }); onSaved(); };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0 }}>{f._id ? "Edit flow" : "New flow"}</h2><button onClick={onClose} style={ghost}>← Back</button></div>
            <div style={{ ...card, background: "#f8fafc", display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ Build a flow from a description</div>
                <div style={{ display: "flex", gap: 8 }}><input style={{ ...input, flex: 1 }} placeholder='e.g. 3-email welcome series for new subscribers' value={prompt} onChange={(e) => setPrompt(e.target.value)} /><button onClick={aiBuild} disabled={aiBusy} style={ghost}>{aiBusy ? "Building…" : "Build"}</button></div>
            </div>
            <div style={{ ...card, display: "grid", gap: 10 }}>
                <Field label="Name"><input style={input} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                    <Field label="Trigger" style={{ flex: 1 }}><select style={input} value={f.trigger} onChange={(e) => setF((s) => ({ ...s, trigger: e.target.value }))}>{TRIGGERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
                    <Field label="Audience (optional segment)" style={{ flex: 1 }}><select style={input} value={f.segmentId || ""} onChange={(e) => setF((s) => ({ ...s, segmentId: e.target.value || undefined }))}><option value="">Everyone eligible</option>{segments.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>
                </div>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem" }}><input type="checkbox" checked={!!f.active} onChange={(e) => setF((s) => ({ ...s, active: e.target.checked }))} /> Active</label>
            </div>
            <div style={{ ...card, display: "grid", gap: 12 }}>
                <b style={{ fontSize: "0.9rem" }}>Steps</b>
                {f.steps.map((st, i) => (
                    <div key={i} style={{ border: "1px solid #eef2f7", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Wait</span>
                            <input type="number" style={{ ...input, width: 90 }} value={st.delayHours} onChange={(e) => setStep(i, "delayHours", Number(e.target.value))} /><span style={{ fontSize: "0.82rem", color: "#64748b" }}>hours, then</span>
                            <select style={{ ...input, width: 110 }} value={st.channel} onChange={(e) => setStep(i, "channel", e.target.value)}><option value="email">Email</option><option value="sms">SMS</option></select>
                            <button onClick={() => previewStep(st)} style={{ ...ghost, marginLeft: "auto" }}>Preview</button>
                            <button onClick={() => rmStep(i)} style={{ ...ghost, color: "#dc2626" }}>×</button>
                        </div>
                        {st.channel === "email" ? <>
                            <input style={input} placeholder="Subject" value={st.subject || ""} onChange={(e) => setStep(i, "subject", e.target.value)} />
                            <textarea style={{ ...input, minHeight: 80 }} placeholder="Email HTML" value={st.html || ""} onChange={(e) => setStep(i, "html", e.target.value)} />
                        </> : <textarea style={{ ...input, minHeight: 60 }} placeholder="SMS message" value={st.body || ""} onChange={(e) => setStep(i, "body", e.target.value)} />}
                    </div>
                ))}
                <button onClick={addStep} style={ghost}>+ Add step</button>
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}><button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save flow"}</button>{f._id && <button onClick={del} style={{ ...ghost, marginLeft: "auto", color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>}</div>
        </div>
    );
}

// ── Segments ─────────────────────────────────────────────────────────────────
function Segments() {
    const [list, setList] = useState(null);
    const [editing, setEditing] = useState(null);
    const load = useCallback(async () => { try { const d = await (await fetch("/api/storefront/segments")).json(); setList(d.error ? [] : d.segments); } catch { setList([]); } }, []);
    useEffect(() => { load(); }, [load]);
    if (editing) return <SegmentEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={() => setEditing({ name: "", description: "", rules: { match: "all", conditions: [] } })} style={btn}>New segment</button></div>
            {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 ? <div style={card}>No segments yet.</div> :
                list.map((s) => (
                    <div key={s._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{s.rules?.conditions?.length || 0} rule(s){s.description ? ` · ${s.description}` : ""}</div></div>
                        <button onClick={() => setEditing({ ...s })} style={ghost}>Edit</button>
                    </div>
                ))}
        </div>
    );
}

function SegmentEditor({ initial, onClose, onSaved }) {
    const [s, setS] = useState({ rules: { match: "all", conditions: [] }, ...initial });
    const [prompt, setPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const setCond = (i, k, v) => setS((p) => ({ ...p, rules: { ...p.rules, conditions: p.rules.conditions.map((x, j) => j === i ? { ...x, [k]: v } : x) } }));
    const addCond = () => setS((p) => ({ ...p, rules: { ...p.rules, conditions: [...p.rules.conditions, { field: "ordersCount", op: "gte", value: 1 }] } }));
    const rmCond = (i) => setS((p) => ({ ...p, rules: { ...p.rules, conditions: p.rules.conditions.filter((_, j) => j !== i) } }));

    const aiBuild = async () => {
        if (!prompt.trim()) return; setAiBusy(true); setError(null);
        try { const d = await (await fetch("/api/storefront/segments/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })).json(); if (d.error) throw new Error(d.error); setS((p) => ({ ...p, name: d.name || p.name, description: d.description || p.description, rules: d.rules || p.rules })); }
        catch (e) { setError(e.message); } finally { setAiBusy(false); }
    };
    const save = async () => {
        if (!s.name) { setError("Name required."); return; } setBusy(true); setError(null);
        const payload = { name: s.name, description: s.description, rules: s.rules };
        try { const url = s._id ? `/api/storefront/segments/${s._id}` : "/api/storefront/segments"; const d = await (await fetch(url, { method: s._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json(); if (d.error) throw new Error(d.error); onSaved(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };
    const del = async () => { if (!s._id || !confirm("Delete segment?")) return; await fetch(`/api/storefront/segments/${s._id}`, { method: "DELETE" }); onSaved(); };
    const boolField = (fld) => ["emailConsent", "smsConsent", "isLead", "emailVerified"].includes(fld);

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0 }}>{s._id ? "Edit segment" : "New segment"}</h2><button onClick={onClose} style={ghost}>← Back</button></div>
            <div style={{ ...card, background: "#f8fafc", display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ Describe the audience</div>
                <div style={{ display: "flex", gap: 8 }}><input style={{ ...input, flex: 1 }} placeholder='e.g. customers who spent over $100 and haven&apos;t ordered in 60 days' value={prompt} onChange={(e) => setPrompt(e.target.value)} /><button onClick={aiBuild} disabled={aiBusy} style={ghost}>{aiBusy ? "Building…" : "Build"}</button></div>
            </div>
            <div style={{ ...card, display: "grid", gap: 10 }}>
                <Field label="Name"><input style={input} value={s.name} onChange={(e) => setS((p) => ({ ...p, name: e.target.value }))} /></Field>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><b style={{ fontSize: "0.9rem" }}>Match</b><select style={{ ...input, width: 90 }} value={s.rules.match} onChange={(e) => setS((p) => ({ ...p, rules: { ...p.rules, match: e.target.value } }))}><option value="all">all</option><option value="any">any</option></select><span style={{ color: "#64748b", fontSize: "0.85rem" }}>of:</span></div>
                {s.rules.conditions.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 6 }}>
                        <select style={{ ...input, flex: 1 }} value={c.field} onChange={(e) => setCond(i, "field", e.target.value)}>{SEG_FIELDS.map((f) => <option key={f}>{f}</option>)}</select>
                        <select style={{ ...input, width: 80 }} value={c.op} onChange={(e) => setCond(i, "op", e.target.value)}>{SEG_OPS.map((o) => <option key={o}>{o}</option>)}</select>
                        {boolField(c.field) ? <select style={{ ...input, width: 90 }} value={String(c.value)} onChange={(e) => setCond(i, "value", e.target.value === "true")}><option value="true">true</option><option value="false">false</option></select>
                            : <input style={{ ...input, flex: 1 }} value={c.value} onChange={(e) => setCond(i, "value", e.target.value)} placeholder="value" />}
                        <button onClick={() => rmCond(i)} style={{ ...ghost, color: "#dc2626" }}>×</button>
                    </div>
                ))}
                <button onClick={addCond} style={ghost}>+ Add condition</button>
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}><button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save segment"}</button>{s._id && <button onClick={del} style={{ ...ghost, marginLeft: "auto", color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>}</div>
        </div>
    );
}

function Field({ label, children, style }) {
    return <label style={{ display: "block", ...style }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
