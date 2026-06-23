"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };

export default function MarketingClient() {
    const [tab, setTab] = useState("campaigns");
    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: "0 0 4px" }}>Marketing</h1>
            <p style={{ color: "#64748b", margin: "0 0 20px" }}>Email & SMS campaigns and your signup popup. Sends throttle automatically to protect your sender reputation.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {[["campaigns", "Campaigns"], ["popup", "Signup popup"]].map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} style={{ ...ghost, ...(tab === k ? { background: "#eef2ff", borderColor: "#635bff", color: "#635bff" } : {}) }}>{label}</button>
                ))}
            </div>
            {tab === "campaigns" ? <Campaigns /> : <PopupConfig />}
        </div>
    );
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
function Campaigns() {
    const [list, setList] = useState(null);
    const [composing, setComposing] = useState(false);

    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/marketing/campaigns")).json(); setList(d.error ? [] : d.campaigns); } catch { setList([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {!composing && <button onClick={() => setComposing(true)} style={btn}>New campaign</button>}
            </div>
            {composing && <Composer onDone={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />}
            {list === null ? <div style={{ color: "#64748b" }}>Loading…</div>
                : list.length === 0 && !composing ? <div style={card}>No campaigns yet.</div>
                : list.map((c) => <CampaignRow key={c._id} c={c} onChange={load} />)}
        </div>
    );
}

function CampaignRow({ c, onChange }) {
    const [busy, setBusy] = useState(false);
    const send = async () => {
        if (!confirm(`Send "${c.name}" now? This goes to all opted-in ${c.channel} contacts.`)) return;
        setBusy(true);
        try { const d = await (await fetch(`/api/marketing/campaigns/${c._id}/send`, { method: "POST" })).json(); if (d.error) alert(d.error); onChange(); }
        finally { setBusy(false); }
    };
    return (
        <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
                <div style={{ fontWeight: 700 }}>{c.name} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· {c.channel} · {c.audience}</span></div>
                <div style={{ color: "#64748b", fontSize: "0.82rem" }}>
                    {c.status === "sent" || c.status === "sending"
                        ? `${c.status} · ${c.stats?.queued ?? 0} queued / ${c.stats?.recipients ?? 0} recipients`
                        : c.status}
                </div>
            </div>
            {c.status === "draft" && <button onClick={send} disabled={busy} style={btn}>{busy ? "…" : "Send"}</button>}
        </div>
    );
}

// Default props when adding a new block in the builder.
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

// Visual email builder — edits a blocks array that's rendered to email HTML via React Email on send.
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

function Composer({ onDone, onCancel }) {
    const [f, setF] = useState({ channel: "email", name: "", audience: "all", segmentId: "", subject: "", html: "", blocks: [], body: "" });
    const [segments, setSegments] = useState([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    useEffect(() => { fetch("/api/storefront/segments").then((r) => r.json()).then((d) => !d.error && setSegments(d.segments)).catch(() => {}); }, []);

    // On-page email preview: render the current blocks/html to the real email HTML (server-side).
    const [previewHtml, setPreviewHtml] = useState("");
    const [rendering, setRendering] = useState(false);
    const refreshPreview = async (override) => {
        const src = override || f;
        if (src.channel && src.channel !== "email") return;
        setRendering(true);
        try {
            const d = await (await fetch("/api/marketing/render-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: src.subject, html: src.html, blocks: src.blocks }) })).json();
            if (!d.error) setPreviewHtml(d.html || "");
        } catch { /* ignore */ } finally { setRendering(false); }
    };
    // Live preview: re-render shortly after the seller edits blocks/subject (debounced).
    useEffect(() => {
        if (f.channel !== "email") return;
        const t = setTimeout(() => refreshPreview(), 700);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(f.blocks), f.html, f.subject, f.channel]);

    const aiDraft = async () => {
        if (!aiPrompt.trim()) return;
        setAiBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/marketing/ai-draft", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channel: f.channel, prompt: aiPrompt }),
            })).json();
            if (d.error) throw new Error(d.error);
            setF((s) => ({ ...s, subject: d.subject ?? s.subject, blocks: Array.isArray(d.blocks) ? d.blocks : s.blocks, html: d.html ?? s.html, body: d.body ?? s.body }));
            if (f.channel === "email") refreshPreview({ channel: "email", subject: d.subject, html: d.html, blocks: d.blocks });
        } catch (e) { setError(e.message); }
        finally { setAiBusy(false); }
    };

    const save = async () => {
        if (!f.name) { setError("Give the campaign a name."); return; }
        setBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/marketing/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })).json();
            if (d.error) throw new Error(d.error);
            onDone();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const [previewBusy, setPreviewBusy] = useState(false);
    const sendPreview = async () => {
        const to = window.prompt(f.channel === "sms" ? "Send a preview text to which number? (+1…)" : "Send a preview email to which address?");
        if (!to) return;
        setPreviewBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/marketing/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: f.channel, subject: f.subject, html: f.html, blocks: f.blocks, body: f.body, to }) })).json();
            if (d.error) throw new Error(d.error);
            alert("Preview sent ✓");
        } catch (e) { setError(`Preview failed: ${e.message}`); }
        finally { setPreviewBusy(false); }
    };

    return (
        <div style={{ ...card, display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>New campaign</h3>
            <div style={{ display: "flex", gap: 10 }}>
                <select value={f.channel} onChange={set("channel")} style={{ ...input, flex: 1 }}>
                    <option value="email">Email</option><option value="sms">SMS</option>
                </select>
                <select value={f.audience} onChange={set("audience")} style={{ ...input, flex: 1 }}>
                    <option value="all">All subscribers</option>
                    <option value="customers">Customers (with account)</option>
                    <option value="leads">Leads (popup signups)</option>
                    <option value="segment">Specific segment…</option>
                </select>
                {f.audience === "segment" && (
                    <select value={f.segmentId} onChange={set("segmentId")} style={{ ...input, flex: 1 }}>
                        <option value="">Pick a segment</option>
                        {segments.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                )}
            </div>
            <input style={input} placeholder="Campaign name (internal)" value={f.name} onChange={set("name")} />

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ AI assist</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...input, flex: 1 }} placeholder="e.g. Announce a 20% weekend sale on hoodies" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                    <button onClick={aiDraft} disabled={aiBusy} style={ghost}>{aiBusy ? "Drafting…" : "Draft"}</button>
                </div>
            </div>

            {f.channel === "email" ? (
                // Two-pane builder: the preview is the main view; blocks live in a sidebar next to it.
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Sidebar — editor */}
                    <div style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 400, display: "grid", gap: 8 }}>
                        <input style={input} placeholder="Subject line" value={f.subject} onChange={set("subject")} />
                        <div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>Blocks</div>
                        <BlockEditor blocks={f.blocks} setBlocks={(b) => setF((s) => ({ ...s, blocks: b }))} />
                        <details>
                            <summary style={{ fontSize: "0.8rem", color: "#94a3b8", cursor: "pointer" }}>Advanced: raw HTML (used only if no blocks above)</summary>
                            <textarea style={{ ...input, minHeight: 120, fontFamily: "monospace", marginTop: 6 }} placeholder="Email HTML body" value={f.html} onChange={set("html")} />
                        </details>
                    </div>
                    {/* Main — live preview */}
                    <div style={{ flex: "2 1 460px", minWidth: 300, display: "grid", gap: 8, position: "sticky", top: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>Preview {rendering && <span style={{ color: "#94a3b8", fontWeight: 400 }}>· updating…</span>}</div>
                            <button type="button" onClick={() => refreshPreview()} disabled={rendering} style={ghost}>Refresh</button>
                        </div>
                        {previewHtml
                            ? <iframe title="Email preview" srcDoc={previewHtml} style={{ width: "100%", height: 640, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }} />
                            : <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: 40, border: "1px dashed #cbd5e1", borderRadius: 10, textAlign: "center", background: "#fff" }}>Add blocks in the sidebar (or click <b>Draft</b>) to see your email here.</div>}
                    </div>
                </div>
            ) : (
                <textarea style={{ ...input, minHeight: 100 }} placeholder="SMS message" value={f.body} onChange={set("body")} />
            )}

            {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save draft"}</button>
                <button onClick={sendPreview} disabled={previewBusy} style={ghost}>{previewBusy ? "Sending…" : "Send preview"}</button>
                <button onClick={onCancel} style={ghost}>Cancel</button>
            </div>
        </div>
    );
}

// ── Signup popup config ─────────────────────────────────────────────────────────
function PopupConfig() {
    const [p, setP] = useState(null);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/marketing/popup").then((r) => r.json()).then((d) => setP(d.popup || {})).catch(() => setP({}));
    }, []);
    const set = (k) => (e) => { const v = e.target.type === "checkbox" ? e.target.checked : (e.target.type === "number" ? Number(e.target.value) : e.target.value); setP((s) => ({ ...s, [k]: v })); setSaved(false); };

    const save = async () => {
        setBusy(true);
        try { await fetch("/api/marketing/popup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); setSaved(true); }
        finally { setBusy(false); }
    };

    if (!p) return <div style={{ color: "#64748b" }}>Loading…</div>;

    return (
        <div style={{ ...card, display: "grid", gap: 12, maxWidth: 560 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <input type="checkbox" checked={!!p.enabled} onChange={set("enabled")} /> Enable signup popup
            </label>
            <Field label="Headline"><input style={input} value={p.headline || ""} onChange={set("headline")} /></Field>
            <Field label="Body text"><input style={input} value={p.body || ""} onChange={set("body")} /></Field>
            <Field label="Button text"><input style={input} value={p.buttonText || ""} onChange={set("buttonText")} /></Field>
            <div style={{ display: "flex", gap: 10 }}>
                <Field label="Discount type" style={{ flex: 1 }}>
                    <select style={input} value={p.discountType || "percent"} onChange={set("discountType")}>
                        <option value="none">No discount (list only)</option><option value="percent">Percent off</option><option value="fixed">Amount off (cents)</option>
                    </select>
                </Field>
                <Field label="Discount value" style={{ flex: 1 }}><input type="number" style={input} value={p.discountValue ?? 10} onChange={set("discountValue")} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <Field label="Code prefix" style={{ flex: 1 }}><input style={input} value={p.codePrefix || "WELCOME"} onChange={set("codePrefix")} /></Field>
                <Field label="Show after (seconds)" style={{ flex: 1 }}><input type="number" style={input} value={p.delaySeconds ?? 5} onChange={set("delaySeconds")} /></Field>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={!!p.collectPhone} onChange={set("collectPhone")} /> Also collect phone (SMS)</label>
            {p.collectPhone && <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={!!p.requirePhone} onChange={set("requirePhone")} /> Require phone</label>}
            <Field label="Email consent text"><textarea style={{ ...input, minHeight: 54 }} value={p.emailConsentText || ""} onChange={set("emailConsentText")} /></Field>
            {p.collectPhone && <Field label="SMS consent text"><textarea style={{ ...input, minHeight: 54 }} value={p.smsConsentText || ""} onChange={set("smsConsentText")} /></Field>}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save"}</button>
                {saved && <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.88rem" }}>Saved ✓</span>}
            </div>
        </div>
    );
}

function Field({ label, children, style }) {
    return <label style={{ display: "block", ...style }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
