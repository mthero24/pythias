"use client";
import { useEffect, useState } from "react";

// Shared visual email builder — used by BOTH the marketing campaign composer and the automation
// step editor so they look/behave identically. `value` = { subject, html, blocks }; `onChange`
// receives the merged value. Renders a two-pane layout: block editor sidebar + live preview.
const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };

const NEW_BLOCK = {
    heading:  { type: "heading", text: "Your heading" },
    text:     { type: "text", text: "Write your message…" },
    button:   { type: "button", label: "Shop now", href: "" },
    image:    { type: "image", src: "" },
    products: { type: "products", heading: "Featured", query: "", limit: 3 },
    divider:  { type: "divider" },
    spacer:   { type: "spacer", height: 24 },
};
const BLOCK_ORDER = ["heading", "text", "button", "image", "products", "divider", "spacer"];

function BlockEditor({ blocks = [], setBlocks }) {
    const tiny = { border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: "2px 7px", marginLeft: 4, cursor: "pointer", fontSize: "0.8rem" };
    const update = (i, patch) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
    const remove = (i) => setBlocks(blocks.filter((_, j) => j !== i));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= blocks.length) return; const c = [...blocks]; [c[i], c[j]] = [c[j], c[i]]; setBlocks(c); };
    const add = (t) => setBlocks([...blocks, { ...NEW_BLOCK[t] }]);
    const [genIdx, setGenIdx] = useState(-1);
    const genImage = async (i) => {
        const prompt = blocks[i]?.src || "";
        if (!prompt.trim()) { alert("Type a description of the image first, then Generate."); return; }
        setGenIdx(i);
        try {
            const d = await (await fetch("/api/marketing/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })).json();
            if (d.url) update(i, { src: d.url }); else alert(d.error || "Generation failed");
        } catch { alert("Generation failed"); } finally { setGenIdx(-1); }
    };
    return (
        <div style={{ display: "grid", gap: 8 }}>
            {blocks.map((b, i) => (
                <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <strong style={{ fontSize: "0.78rem", textTransform: "capitalize", color: "#475569" }}>{b.type}</strong>
                        <span>
                            <button type="button" onClick={() => move(i, -1)} style={tiny}>↑</button>
                            <button type="button" onClick={() => move(i, 1)} style={tiny}>↓</button>
                            <button type="button" onClick={() => remove(i)} style={tiny}>✕</button>
                        </span>
                    </div>
                    {b.type === "heading" && <input style={input} value={b.text || ""} placeholder="Heading text" onChange={(e) => update(i, { text: e.target.value })} />}
                    {b.type === "text" && <textarea style={{ ...input, minHeight: 70 }} value={b.text || ""} placeholder="Body text" onChange={(e) => update(i, { text: e.target.value })} />}
                    {b.type === "button" && <div style={{ display: "grid", gap: 6 }}>
                        <input style={input} value={b.label || ""} placeholder="Button label" onChange={(e) => update(i, { label: e.target.value })} />
                        <input style={input} value={b.href || ""} placeholder="Link URL (https://…)" onChange={(e) => update(i, { href: e.target.value })} />
                    </div>}
                    {b.type === "image" && <div style={{ display: "grid", gap: 6 }}>
                        <input style={input} value={b.src || ""} placeholder="Image URL — or describe a scene and Generate" onChange={(e) => update(i, { src: e.target.value })} />
                        <button type="button" onClick={() => genImage(i)} disabled={genIdx === i} style={ghost}>{genIdx === i ? "Generating…" : "✨ Generate AI image"}</button>
                        {b.src && /^https?:/i.test(b.src) && <img src={b.src} alt="" style={{ maxWidth: "100%", borderRadius: 6, border: "1px solid #e2e8f0" }} />}
                    </div>}
                    {b.type === "products" && <div style={{ display: "grid", gap: 6 }}>
                        <input style={input} value={b.heading || ""} placeholder="Section heading (e.g. Featured)" onChange={(e) => update(i, { heading: e.target.value })} />
                        <input style={input} value={b.query || ""} placeholder="Product search (e.g. hoodies) — auto-pulls matching products" onChange={(e) => update(i, { query: e.target.value })} />
                    </div>}
                    {b.type === "spacer" && <input style={input} type="number" value={b.height ?? 24} placeholder="Height (px)" onChange={(e) => update(i, { height: parseInt(e.target.value) || 24 })} />}
                </div>
            ))}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BLOCK_ORDER.map((t) => <button type="button" key={t} onClick={() => add(t)} style={ghost}>+ {t}</button>)}
            </div>
        </div>
    );
}

export function EmailBuilder({ value = {}, onChange, showSubject = true }) {
    const subject = value.subject || "", html = value.html || "", blocks = value.blocks || [];
    const set = (patch) => onChange?.({ ...value, ...patch });
    const [previewHtml, setPreviewHtml] = useState("");
    const [rendering, setRendering] = useState(false);

    const refreshPreview = async (override) => {
        const src = override || { subject, html, blocks };
        setRendering(true);
        try {
            const d = await (await fetch("/api/marketing/render-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: src.subject, html: src.html, blocks: src.blocks }) })).json();
            if (!d.error) setPreviewHtml(d.html || "");
        } catch { /* ignore */ } finally { setRendering(false); }
    };
    // Live preview, debounced after edits.
    useEffect(() => {
        const t = setTimeout(() => refreshPreview(), 700);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(blocks), html, subject]);

    return (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 400, display: "grid", gap: 8 }}>
                {showSubject && <input style={input} placeholder="Subject line" value={subject} onChange={(e) => set({ subject: e.target.value })} />}
                <div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>Blocks</div>
                <BlockEditor blocks={blocks} setBlocks={(b) => set({ blocks: b })} />
                <details>
                    <summary style={{ fontSize: "0.8rem", color: "#94a3b8", cursor: "pointer" }}>Advanced: raw HTML (used only if no blocks above)</summary>
                    <textarea style={{ ...input, minHeight: 120, fontFamily: "monospace", marginTop: 6 }} placeholder="Email HTML body" value={html} onChange={(e) => set({ html: e.target.value })} />
                </details>
            </div>
            <div style={{ flex: "2 1 460px", minWidth: 300, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>Preview {rendering && <span style={{ color: "#94a3b8", fontWeight: 400 }}>· updating…</span>}</div>
                    <button type="button" onClick={() => refreshPreview()} disabled={rendering} style={ghost}>Refresh</button>
                </div>
                {previewHtml
                    ? <iframe title="Email preview" srcDoc={previewHtml} style={{ width: "100%", height: 560, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }} />
                    : <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: 40, border: "1px dashed #cbd5e1", borderRadius: 10, textAlign: "center", background: "#fff" }}>Add blocks to see your email here.</div>}
            </div>
        </div>
    );
}
