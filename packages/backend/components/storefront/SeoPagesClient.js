"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };

// Pull editable flat fields out of a page's sections[].
function toForm(p) {
    const hero = (p?.sections || []).find((s) => s.type === "hero") || {};
    const text = (p?.sections || []).find((s) => s.type === "richText") || {};
    const hasProducts = (p?.sections || []).some((s) => s.type === "featuredProducts");
    return {
        id: p?._id, title: p?.title || "", slug: p?.slug || "",
        metaTitle: p?.seo?.title || "", metaDescription: p?.seo?.description || "",
        keywords: (p?.keywords || []).join(", "),
        heroHeadline: hero.headline || "", heroSubheadline: hero.subheadline || "", ctaText: hero.ctaText || "Shop now",
        bodyHeading: text.heading || "", bodyText: text.body || "",
        showProducts: hasProducts !== false, status: p?.status || "draft",
    };
}
// Rebuild sections[] + payload from the flat form.
function toPayload(f) {
    const sections = [
        { type: "hero", headline: f.heroHeadline || f.title, subheadline: f.heroSubheadline, ctaText: f.ctaText, ctaLink: "/products", align: "center" },
        { type: "richText", heading: f.bodyHeading, body: f.bodyText, align: "left" },
    ];
    if (f.showProducts) sections.push({ type: "featuredProducts", heading: "Shop the collection", limit: 8 });
    return {
        title: f.title, slug: f.slug,
        seo: { title: f.metaTitle, description: f.metaDescription },
        keywords: f.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        sections, status: f.status,
    };
}

export default function SeoPagesClient({ viewBase }) {
    const [pages, setPages] = useState(null);
    const [editing, setEditing] = useState(null);   // form object or null

    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/storefront/pages")).json(); setPages(d.error ? [] : d.pages); } catch { setPages([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    if (editing) return <Editor form={editing} viewBase={viewBase} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>SEO landing pages</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>Create keyword-targeted pages on your store. Generate a draft with AI, then publish.</p>
                </div>
                <button onClick={() => setEditing(toForm(null))} style={btn}>New page</button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {pages === null ? <div style={{ color: "#64748b" }}>Loading…</div>
                    : pages.length === 0 ? <div style={card}>No pages yet. Create one to rank for a keyword.</div>
                    : pages.map((p) => (
                        <div key={p._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>{p.title} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>/{p.slug}</span></div>
                                <div style={{ fontSize: "0.8rem", color: p.status === "published" ? "#16a34a" : "#94a3b8" }}>
                                    {p.status}{p.status === "published" && viewBase && <> · <a href={`${viewBase}/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: "#635bff" }}>view ↗</a></>}
                                </div>
                            </div>
                            <button onClick={() => setEditing(toForm(p))} style={ghost}>Edit</button>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function Editor({ form, viewBase, onClose, onSaved }) {
    const [f, setF] = useState(form);
    const [keyword, setKeyword] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const generate = async () => {
        if (!keyword.trim()) return;
        setAiBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/storefront/pages/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword }) })).json();
            if (d.error) throw new Error(d.error);
            const draft = toForm({ title: d.title, slug: d.slug, seo: d.seo, keywords: d.keywords, sections: d.sections, status: f.status });
            setF((s) => ({ ...s, ...draft, id: s.id }));   // keep id if editing
        } catch (e) { setError(e.message); }
        finally { setAiBusy(false); }
    };

    const save = async (publish) => {
        if (!f.title) { setError("Title is required."); return; }
        setBusy(true); setError(null);
        const payload = { ...toPayload(f), status: publish ? "published" : (f.status || "draft") };
        try {
            const url = f.id ? `/api/storefront/pages/${f.id}` : "/api/storefront/pages";
            const d = await (await fetch(url, { method: f.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json();
            if (d.error) throw new Error(d.error);
            onSaved();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const del = async () => {
        if (!f.id || !confirm("Delete this page?")) return;
        await fetch(`/api/storefront/pages/${f.id}`, { method: "DELETE" });
        onSaved();
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>{f.id ? "Edit page" : "New page"}</h1>
                <button onClick={onClose} style={ghost}>← Back</button>
            </div>

            <div style={{ ...card, background: "#f8fafc", display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ Generate from a keyword</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...input, flex: 1 }} placeholder='e.g. "organic cotton baby onesies"' value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                    <button onClick={generate} disabled={aiBusy} style={ghost}>{aiBusy ? "Generating…" : "Generate"}</button>
                </div>
            </div>

            <div style={{ ...card, display: "grid", gap: 10 }}>
                <Field label="Page title (H1)"><input style={input} value={f.title} onChange={set("title")} /></Field>
                <Field label="URL slug"><input style={input} value={f.slug} onChange={set("slug")} placeholder="best-running-shoes" /></Field>
                {viewBase && f.slug && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{viewBase}/{f.slug}</div>}
                <Field label="Meta title (SEO)"><input style={input} value={f.metaTitle} onChange={set("metaTitle")} maxLength={70} /></Field>
                <Field label="Meta description (SEO)"><textarea style={{ ...input, minHeight: 54 }} value={f.metaDescription} onChange={set("metaDescription")} maxLength={170} /></Field>
                <Field label="Target keywords (comma-separated)"><input style={input} value={f.keywords} onChange={set("keywords")} /></Field>
            </div>

            <div style={{ ...card, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 700 }}>Content</div>
                <Field label="Hero headline"><input style={input} value={f.heroHeadline} onChange={set("heroHeadline")} /></Field>
                <Field label="Hero subheadline"><textarea style={{ ...input, minHeight: 44 }} value={f.heroSubheadline} onChange={set("heroSubheadline")} /></Field>
                <Field label="Button text"><input style={input} value={f.ctaText} onChange={set("ctaText")} /></Field>
                <Field label="Body heading"><input style={input} value={f.bodyHeading} onChange={set("bodyHeading")} /></Field>
                <Field label="Body text"><textarea style={{ ...input, minHeight: 160 }} value={f.bodyText} onChange={set("bodyText")} /></Field>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem" }}><input type="checkbox" checked={f.showProducts} onChange={set("showProducts")} /> Show a featured-products section</label>
            </div>

            {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => save(false)} disabled={busy} style={ghost}>Save draft</button>
                <button onClick={() => save(true)} disabled={busy} style={btn}>{busy ? "Saving…" : "Publish"}</button>
                {f.id && <button onClick={del} style={{ ...ghost, marginLeft: "auto", color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>}
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return <label style={{ display: "block" }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
