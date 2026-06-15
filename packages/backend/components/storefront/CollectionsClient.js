"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };

const FIELDS = ["tag", "category", "brand", "title", "priceCents"];
const OPS = ["contains", "eq", "lte", "gte"];

const blank = () => ({ title: "", slug: "", description: "", image: "", type: "smart", sort: "featured",
    seo: { title: "", description: "" }, rules: { match: "all", conditions: [] }, productIds: [], status: "draft" });

export default function CollectionsClient({ viewBase }) {
    const [list, setList] = useState(null);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/storefront/collections")).json(); setList(d.error ? [] : d.collections); } catch { setList([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    if (editing) return <Editor initial={editing} viewBase={viewBase} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Collections</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>Group products into category pages. Smart collections auto-fill from rules — or describe one and let AI build it.</p>
                </div>
                <button onClick={() => setEditing(blank())} style={btn}>New collection</button>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {list === null ? <div style={{ color: "#64748b" }}>Loading…</div>
                    : list.length === 0 ? <div style={card}>No collections yet.</div>
                    : list.map((c) => (
                        <div key={c._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>{c.title} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>/{c.slug} · {c.type}</span></div>
                                <div style={{ fontSize: "0.8rem", color: c.status === "published" ? "#16a34a" : "#94a3b8" }}>
                                    {c.status}{c.status === "published" && viewBase && <> · <a href={`${viewBase}/collections/${c.slug}`} target="_blank" rel="noreferrer" style={{ color: "#635bff" }}>view ↗</a></>}
                                </div>
                            </div>
                            <button onClick={() => setEditing({ ...blank(), ...c })} style={ghost}>Edit</button>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function Editor({ initial, viewBase, onClose, onSaved }) {
    const [c, setC] = useState({ ...initial, seo: initial.seo || {}, rules: initial.rules || { match: "all", conditions: [] } });
    const [prompt, setPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setC((s) => ({ ...s, [k]: e.target.value }));
    const setSeo = (k) => (e) => setC((s) => ({ ...s, seo: { ...s.seo, [k]: e.target.value } }));

    const addCond = () => setC((s) => ({ ...s, rules: { ...s.rules, conditions: [...s.rules.conditions, { field: "category", op: "contains", value: "" }] } }));
    const setCond = (i, k, v) => setC((s) => { const conditions = s.rules.conditions.map((x, j) => j === i ? { ...x, [k]: v } : x); return { ...s, rules: { ...s.rules, conditions } }; });
    const rmCond = (i) => setC((s) => ({ ...s, rules: { ...s.rules, conditions: s.rules.conditions.filter((_, j) => j !== i) } }));

    const generate = async () => {
        if (!prompt.trim()) return;
        setAiBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/storefront/collections/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })).json();
            if (d.error) throw new Error(d.error);
            setC((s) => ({ ...s, title: d.title, slug: d.slug, description: d.description, seo: d.seo || {}, type: "smart", rules: d.rules || s.rules }));
        } catch (e) { setError(e.message); }
        finally { setAiBusy(false); }
    };

    const save = async (publish) => {
        if (!c.title) { setError("Title is required."); return; }
        setBusy(true); setError(null);
        const payload = { ...c, status: publish ? "published" : (c.status || "draft"),
            productIds: typeof c.productIds === "string" ? c.productIds.split(/[\s,]+/).filter(Boolean) : c.productIds };
        try {
            const url = c._id ? `/api/storefront/collections/${c._id}` : "/api/storefront/collections";
            const d = await (await fetch(url, { method: c._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json();
            if (d.error) throw new Error(d.error);
            onSaved();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const del = async () => { if (!c._id || !confirm("Delete this collection?")) return; await fetch(`/api/storefront/collections/${c._id}`, { method: "DELETE" }); onSaved(); };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>{c._id ? "Edit collection" : "New collection"}</h1>
                <button onClick={onClose} style={ghost}>← Back</button>
            </div>

            <div style={{ ...card, background: "#f8fafc", display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ Build a smart collection from a description</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...input, flex: 1 }} placeholder='e.g. "men&apos;s hoodies under $40"' value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    <button onClick={generate} disabled={aiBusy} style={ghost}>{aiBusy ? "Generating…" : "Generate"}</button>
                </div>
            </div>

            <div style={{ ...card, display: "grid", gap: 10 }}>
                <Field label="Title"><input style={input} value={c.title} onChange={set("title")} /></Field>
                <Field label="URL slug"><input style={input} value={c.slug} onChange={set("slug")} placeholder="mens-hoodies" /></Field>
                {viewBase && c.slug && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{viewBase}/collections/{c.slug}</div>}
                <Field label="Description"><textarea style={{ ...input, minHeight: 50 }} value={c.description} onChange={set("description")} /></Field>
                <Field label="Image URL"><input style={input} value={c.image || ""} onChange={set("image")} /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                    <Field label="Type" style={{ flex: 1 }}><select style={input} value={c.type} onChange={set("type")}><option value="smart">Smart (rules)</option><option value="manual">Manual (pick products)</option></select></Field>
                    <Field label="Sort" style={{ flex: 1 }}><select style={input} value={c.sort} onChange={set("sort")}><option value="featured">Featured</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option><option value="title">Name</option></select></Field>
                </div>
            </div>

            {c.type === "smart" ? (
                <div style={{ ...card, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontSize: "0.9rem" }}>Match</b>
                        <select style={{ ...input, width: 100 }} value={c.rules.match} onChange={(e) => setC((s) => ({ ...s, rules: { ...s.rules, match: e.target.value } }))}><option value="all">all</option><option value="any">any</option></select>
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>of these conditions</span>
                    </div>
                    {c.rules.conditions.map((cond, i) => (
                        <div key={i} style={{ display: "flex", gap: 6 }}>
                            <select style={{ ...input, flex: 1 }} value={cond.field} onChange={(e) => setCond(i, "field", e.target.value)}>{FIELDS.map((f) => <option key={f}>{f}</option>)}</select>
                            <select style={{ ...input, width: 110 }} value={cond.op} onChange={(e) => setCond(i, "op", e.target.value)}>{OPS.map((o) => <option key={o}>{o}</option>)}</select>
                            <input style={{ ...input, flex: 1 }} value={cond.value} onChange={(e) => setCond(i, "value", e.target.value)} placeholder={cond.field === "priceCents" ? "cents" : "value"} />
                            <button onClick={() => rmCond(i)} style={{ ...ghost, color: "#dc2626" }}>×</button>
                        </div>
                    ))}
                    <button onClick={addCond} style={ghost}>+ Add condition</button>
                </div>
            ) : (
                <div style={card}>
                    <Field label="Product IDs (comma or newline separated)"><textarea style={{ ...input, minHeight: 80, fontFamily: "monospace" }} value={Array.isArray(c.productIds) ? c.productIds.join("\n") : c.productIds} onChange={set("productIds")} /></Field>
                </div>
            )}

            <div style={{ ...card, display: "grid", gap: 10 }}>
                <Field label="Meta title (SEO)"><input style={input} value={c.seo.title || ""} onChange={setSeo("title")} /></Field>
                <Field label="Meta description (SEO)"><textarea style={{ ...input, minHeight: 44 }} value={c.seo.description || ""} onChange={setSeo("description")} /></Field>
            </div>

            {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => save(false)} disabled={busy} style={ghost}>Save draft</button>
                <button onClick={() => save(true)} disabled={busy} style={btn}>{busy ? "Saving…" : "Publish"}</button>
                {c._id && <button onClick={del} style={{ ...ghost, marginLeft: "auto", color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>}
            </div>
        </div>
    );
}

function Field({ label, children, style }) {
    return <label style={{ display: "block", ...style }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
