"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

// Ink-mix tool: match a target color to the org's saved formulas by ΔE, then scale the chosen
// recipe to grams (and cost) for a batch weight. Also manages the org's base + formula library.
// Self-contained dark styling to match the other production tools (e.g. GTX).

const c = {
    bg: "#0f1117", panel: "#1a1d2e", panel2: "#13162a", border: "#2d3148",
    text: "#e2e8f0", dim: "#9ca3af", faint: "#6b7280", accent: "#4f46e5", good: "#059669", bad: "#dc2626",
};
const s = {
    page: { minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'Inter', sans-serif" },
    top: { background: c.panel, borderBottom: `1px solid ${c.border}`, padding: "14px 22px", display: "flex", alignItems: "center", gap: 16 },
    title: { fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginRight: "auto" },
    tabs: { display: "flex", gap: 6 },
    tab: (on) => ({ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${on ? c.accent : c.border}`, background: on ? c.accent : "transparent", color: on ? "#fff" : c.dim }),
    wrap: { padding: 22, maxWidth: 1100, margin: "0 auto" },
    card: { background: c.panel, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
    label: { fontSize: 11, fontWeight: 700, color: c.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" },
    input: { background: "#252840", color: "#fff", border: `1px solid #3d4168`, borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
    btn: (color = c.accent) => ({ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }),
    ghost: { background: "transparent", color: c.dim, border: `1px solid ${c.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
    swatch: (hex) => ({ width: 28, height: 28, borderRadius: 6, background: hex || "#333", border: "1px solid #0006", flexShrink: 0 }),
    row: { display: "flex", alignItems: "center", gap: 12 },
    th: { textAlign: "left", fontSize: 11, color: c.faint, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 10px", borderBottom: `1px solid ${c.border}` },
    td: { padding: "8px 10px", fontSize: 14, borderBottom: `1px solid ${c.border}` },
    pill: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44` }),
};

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const deltaColor = (d) => (d <= 3 ? c.good : d <= 5 ? "#d97706" : c.bad);
const totalPercent = (comps) => comps.reduce((sum, x) => sum + (Number(x.percent) || 0), 0);

async function api(path, method = "GET", body) {
    const res = await fetch(`/api/production/ink-mix/${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}

export default function InkMixClient() {
    const [tab, setTab] = useState("mix");
    const [bases, setBases] = useState([]);
    const [formulas, setFormulas] = useState([]);

    const load = useCallback(async () => {
        const [b, f] = await Promise.all([api("bases"), api("formulas")]);
        setBases(b.bases || []);
        setFormulas(f.formulas || []);
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div style={s.page}>
            <div style={s.top}>
                <div style={s.title}>Ink Mix</div>
                <div style={s.tabs}>
                    {[["mix", "Mix"], ["formulas", "Formulas"], ["bases", "Bases"]].map(([k, lbl]) => (
                        <div key={k} style={s.tab(tab === k)} onClick={() => setTab(k)}>{lbl}</div>
                    ))}
                </div>
            </div>
            <div style={s.wrap}>
                {tab === "mix" && <MixTab formulas={formulas} />}
                {tab === "formulas" && <FormulasTab formulas={formulas} bases={bases} reload={load} />}
                {tab === "bases" && <BasesTab bases={bases} reload={load} />}
            </div>
        </div>
    );
}

/* ── Mix: target hex + batch weight → ranked ΔE matches → grams & cost ─────────────── */
function MixTab({ formulas }) {
    const [hex, setHex] = useState("#1e88e5");
    const [batch, setBatch] = useState(500);
    const [matches, setMatches] = useState(null);
    const [chosen, setChosen] = useState(null);
    const [busy, setBusy] = useState(false);

    const find = async () => {
        setBusy(true);
        const r = await api("match", "POST", { targetHex: hex, limit: 6 });
        setBusy(false);
        setMatches(r.matches || []);
        setChosen((r.matches || [])[0] || null);
    };

    const scaled = useMemo(() => {
        if (!chosen) return null;
        const rows = (chosen.components || []).map((comp) => {
            const grams = ((Number(comp.percent) || 0) / 100) * (Number(batch) || 0);
            const cost = grams * (comp.base?.costPerGram || 0);
            return { name: comp.base?.name || "—", hex: comp.base?.hex, percent: comp.percent, grams, cost };
        });
        return {
            rows,
            totalPct: totalPercent(chosen.components || []),
            totalGrams: rows.reduce((s2, r) => s2 + r.grams, 0),
            totalCost: rows.reduce((s2, r) => s2 + r.cost, 0),
        };
    }, [chosen, batch]);

    return (
        <>
            <div style={s.card}>
                <div style={{ ...s.row, flexWrap: "wrap", gap: 20 }}>
                    <div>
                        <label style={s.label}>Target color</label>
                        <div style={s.row}>
                            <input type="color" value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000"} onChange={(e) => setHex(e.target.value)} style={{ width: 44, height: 40, border: "none", background: "none", cursor: "pointer" }} />
                            <input style={{ ...s.input, width: 130 }} value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#1e88e5" />
                        </div>
                    </div>
                    <div>
                        <label style={s.label}>Batch weight (g)</label>
                        <input style={{ ...s.input, width: 130 }} type="number" value={batch} onChange={(e) => setBatch(e.target.value)} />
                    </div>
                    <div style={{ alignSelf: "flex-end" }}>
                        <button style={s.btn()} onClick={find} disabled={busy}>{busy ? "Matching…" : "Find formula"}</button>
                    </div>
                </div>
                {!formulas.length && <p style={{ color: c.dim, marginTop: 14, marginBottom: 0 }}>No saved formulas yet — add some under the <b>Formulas</b> tab so matching has something to search.</p>}
            </div>

            {matches && (
                <div style={s.card}>
                    <label style={s.label}>Closest formulas (ΔE00)</label>
                    {!matches.length && <p style={{ color: c.dim }}>No formulas to match against.</p>}
                    {matches.map((m) => (
                        <div key={m._id} onClick={() => setChosen(m)}
                            style={{ ...s.row, padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 6, border: `1px solid ${chosen?._id === m._id ? c.accent : c.border}`, background: chosen?._id === m._id ? "#4f46e51a" : "transparent" }}>
                            <div style={s.swatch(m.targetHex)} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{m.name}{m.pantone ? ` · ${m.pantone}` : ""}</div>
                                <div style={{ fontSize: 12, color: c.dim }}>{(m.components || []).length} base(s){m.substrate ? ` · ${m.substrate}` : ""}</div>
                            </div>
                            <span style={s.pill(deltaColor(m.deltaE))}>ΔE {m.deltaE.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            {scaled && (
                <div style={s.card}>
                    <label style={s.label}>Mixing sheet — {chosen.name} · {Number(batch) || 0} g batch</label>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th style={s.th}>Base</th><th style={s.th}>%</th><th style={s.th}>Grams</th><th style={s.th}>Cost</th></tr></thead>
                        <tbody>
                            {scaled.rows.map((r, i) => (
                                <tr key={i}>
                                    <td style={s.td}><div style={s.row}><div style={s.swatch(r.hex)} /> {r.name}</div></td>
                                    <td style={s.td}>{r.percent}%</td>
                                    <td style={{ ...s.td, fontWeight: 700 }}>{r.grams.toFixed(1)} g</td>
                                    <td style={s.td}>{money(r.cost)}</td>
                                </tr>
                            ))}
                            <tr>
                                <td style={{ ...s.td, fontWeight: 800 }}>Total</td>
                                <td style={{ ...s.td, color: Math.abs(scaled.totalPct - 100) > 0.01 ? c.bad : c.good }}>{scaled.totalPct}%</td>
                                <td style={{ ...s.td, fontWeight: 800 }}>{scaled.totalGrams.toFixed(1)} g</td>
                                <td style={{ ...s.td, fontWeight: 800 }}>{money(scaled.totalCost)}</td>
                            </tr>
                        </tbody>
                    </table>
                    {Math.abs(scaled.totalPct - 100) > 0.01 && <p style={{ color: c.bad, fontSize: 12, marginBottom: 0 }}>⚠ Formula percentages sum to {scaled.totalPct}%, not 100% — grams are scaled to the batch weight regardless, but check the recipe.</p>}
                </div>
            )}
        </>
    );
}

/* ── Bases: the org's component inks ──────────────────────────────────────────────── */
function BasesTab({ bases, reload }) {
    const blank = { name: "", code: "", hex: "#888888", costPerGram: 0 };
    const [form, setForm] = useState(blank);
    const [editId, setEditId] = useState(null);

    const save = async () => {
        if (!form.name.trim()) return;
        if (editId) await api("bases", "PUT", { _id: editId, ...form });
        else await api("bases", "POST", form);
        setForm(blank); setEditId(null); reload();
    };
    const edit = (b) => { setEditId(b._id); setForm({ name: b.name, code: b.code || "", hex: b.hex || "#888888", costPerGram: b.costPerGram || 0 }); };
    const del = async (b) => { if (confirm(`Delete base "${b.name}"?`)) { await api("bases", "DELETE", { _id: b._id }); reload(); } };

    return (
        <>
            <div style={s.card}>
                <label style={s.label}>{editId ? "Edit base" : "Add base"}</label>
                <div style={{ ...s.row, flexWrap: "wrap", gap: 12 }}>
                    <input style={{ ...s.input, width: 220 }} placeholder="Name (e.g. Wilflex Fluor. Blue)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input style={{ ...s.input, width: 120 }} placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                    <div style={s.row}>
                        <input type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} style={{ width: 40, height: 38, border: "none", background: "none" }} />
                        <input style={{ ...s.input, width: 110 }} value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
                    </div>
                    <div>
                        <input style={{ ...s.input, width: 130 }} type="number" step="0.001" placeholder="Cost / gram" value={form.costPerGram} onChange={(e) => setForm({ ...form, costPerGram: e.target.value })} />
                    </div>
                    <button style={s.btn()} onClick={save}>{editId ? "Save" : "Add"}</button>
                    {editId && <button style={s.ghost} onClick={() => { setForm(blank); setEditId(null); }}>Cancel</button>}
                </div>
            </div>
            <div style={s.card}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={s.th}>Base</th><th style={s.th}>Code</th><th style={s.th}>Cost/g</th><th style={s.th}></th></tr></thead>
                    <tbody>
                        {bases.map((b) => (
                            <tr key={b._id}>
                                <td style={s.td}><div style={s.row}><div style={s.swatch(b.hex)} /> {b.name}</div></td>
                                <td style={s.td}>{b.code || "—"}</td>
                                <td style={s.td}>{money(b.costPerGram)}</td>
                                <td style={{ ...s.td, textAlign: "right" }}>
                                    <button style={{ ...s.ghost, marginRight: 6 }} onClick={() => edit(b)}>Edit</button>
                                    <button style={{ ...s.ghost, color: c.bad, borderColor: c.bad + "55" }} onClick={() => del(b)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {!bases.length && <tr><td style={s.td} colSpan={4}><span style={{ color: c.dim }}>No bases yet.</span></td></tr>}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ── Formulas: saved recipes (components + target color) ──────────────────────────── */
function FormulasTab({ formulas, bases, reload }) {
    const blank = { name: "", pantone: "", targetHex: "#1e88e5", substrate: "", notes: "", components: [{ base: "", percent: "" }] };
    const [form, setForm] = useState(blank);
    const [editId, setEditId] = useState(null);

    const setComp = (i, key, val) => {
        const components = form.components.map((cmp, idx) => (idx === i ? { ...cmp, [key]: val } : cmp));
        setForm({ ...form, components });
    };
    const addComp = () => setForm({ ...form, components: [...form.components, { base: "", percent: "" }] });
    const rmComp = (i) => setForm({ ...form, components: form.components.filter((_, idx) => idx !== i) });

    const save = async () => {
        if (!form.name.trim()) return;
        const payload = { ...form, components: form.components.filter((x) => x.base && Number(x.percent) > 0) };
        if (editId) await api("formulas", "PUT", { _id: editId, ...payload });
        else await api("formulas", "POST", payload);
        setForm(blank); setEditId(null); reload();
    };
    const edit = (f) => {
        setEditId(f._id);
        setForm({
            name: f.name, pantone: f.pantone || "", targetHex: f.targetHex || "#1e88e5",
            substrate: f.substrate || "", notes: f.notes || "",
            components: (f.components || []).map((cmp) => ({ base: cmp.base?._id || cmp.base, percent: cmp.percent })),
        });
    };
    const del = async (f) => { if (confirm(`Delete formula "${f.name}"?`)) { await api("formulas", "DELETE", { _id: f._id }); reload(); } };

    const pct = totalPercent(form.components);

    return (
        <>
            <div style={s.card}>
                <label style={s.label}>{editId ? "Edit formula" : "Add formula"}</label>
                <div style={{ ...s.row, flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <input style={{ ...s.input, width: 200 }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input style={{ ...s.input, width: 130 }} placeholder="Pantone (opt)" value={form.pantone} onChange={(e) => setForm({ ...form, pantone: e.target.value })} />
                    <div style={s.row}>
                        <span style={{ fontSize: 12, color: c.dim }}>Result</span>
                        <input type="color" value={form.targetHex} onChange={(e) => setForm({ ...form, targetHex: e.target.value })} style={{ width: 40, height: 38, border: "none", background: "none" }} />
                        <input style={{ ...s.input, width: 110 }} value={form.targetHex} onChange={(e) => setForm({ ...form, targetHex: e.target.value })} />
                    </div>
                    <input style={{ ...s.input, width: 150 }} placeholder="Substrate (opt)" value={form.substrate} onChange={(e) => setForm({ ...form, substrate: e.target.value })} />
                </div>

                <label style={s.label}>Components — % of total <span style={{ color: Math.abs(pct - 100) > 0.01 ? c.bad : c.good }}>({pct}%)</span></label>
                {form.components.map((cmp, i) => (
                    <div key={i} style={{ ...s.row, marginBottom: 8 }}>
                        <select style={{ ...s.input, width: 260 }} value={cmp.base} onChange={(e) => setComp(i, "base", e.target.value)}>
                            <option value="">— base —</option>
                            {bases.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <input style={{ ...s.input, width: 100 }} type="number" step="0.1" placeholder="%" value={cmp.percent} onChange={(e) => setComp(i, "percent", e.target.value)} />
                        <button style={s.ghost} onClick={() => rmComp(i)}>✕</button>
                    </div>
                ))}
                <div style={{ ...s.row, marginTop: 10 }}>
                    <button style={s.ghost} onClick={addComp}>+ component</button>
                    <div style={{ marginLeft: "auto" }}>
                        {editId && <button style={{ ...s.ghost, marginRight: 6 }} onClick={() => { setForm(blank); setEditId(null); }}>Cancel</button>}
                        <button style={s.btn()} onClick={save}>{editId ? "Save formula" : "Add formula"}</button>
                    </div>
                </div>
                {!bases.length && <p style={{ color: c.bad, fontSize: 12 }}>Add bases first (Bases tab) — components pick from them.</p>}
            </div>

            <div style={s.card}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={s.th}>Formula</th><th style={s.th}>Bases</th><th style={s.th}>Substrate</th><th style={s.th}></th></tr></thead>
                    <tbody>
                        {formulas.map((f) => (
                            <tr key={f._id}>
                                <td style={s.td}><div style={s.row}><div style={s.swatch(f.targetHex)} /> {f.name}{f.pantone ? <span style={{ color: c.dim }}> · {f.pantone}</span> : null}</div></td>
                                <td style={s.td}>{(f.components || []).map((cmp) => `${cmp.base?.name || "?"} ${cmp.percent}%`).join(", ") || "—"}</td>
                                <td style={s.td}>{f.substrate || "—"}</td>
                                <td style={{ ...s.td, textAlign: "right" }}>
                                    <button style={{ ...s.ghost, marginRight: 6 }} onClick={() => edit(f)}>Edit</button>
                                    <button style={{ ...s.ghost, color: c.bad, borderColor: c.bad + "55" }} onClick={() => del(f)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {!formulas.length && <tr><td style={s.td} colSpan={4}><span style={{ color: c.dim }}>No formulas yet.</span></td></tr>}
                    </tbody>
                </table>
            </div>
        </>
    );
}
