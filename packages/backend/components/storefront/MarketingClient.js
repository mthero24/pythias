"use client";
import { useCallback, useEffect, useState } from "react";
import { EmailBuilder } from "./EmailBuilder";

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
                {[["campaigns", "Campaigns"], ["push", "App push"], ["popup", "Signup popup"]].map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} style={{ ...ghost, ...(tab === k ? { background: "#eef2ff", borderColor: "#635bff", color: "#635bff" } : {}) }}>{label}</button>
                ))}
            </div>
            {tab === "campaigns" ? <Campaigns /> : tab === "push" ? <PushBroadcasts /> : <PopupConfig />}
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


function Composer({ onDone, onCancel }) {
    const [f, setF] = useState({ channel: "email", name: "", audience: "all", segmentId: "", subject: "", html: "", blocks: [], body: "" });
    const [segments, setSegments] = useState([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    useEffect(() => { fetch("/api/storefront/segments").then((r) => r.json()).then((d) => !d.error && setSegments(d.segments)).catch(() => {}); }, []);

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
                <EmailBuilder value={{ subject: f.subject, html: f.html, blocks: f.blocks }} onChange={(v) => setF((s) => ({ ...s, ...v }))} />
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

// ── Mobile-app push broadcasts ───────────────────────────────────────────────
// Send a one-off push notification to the seller's white-label mobile app users
// (buyers who installed the app + granted push permission). Outward-facing → confirm before send.
const PUSH_SEGMENT_OPTIONS = [
    ["all", "All app users"],
    ["customers", "Customers"],
    ["prospects", "Prospects"],
    ["abandoned_cart", "Abandoned cart"],
    ["active_30", "Active last 30 days"],
];
const PUSH_SEGMENT_LABEL = Object.fromEntries(PUSH_SEGMENT_OPTIONS);

function PushBroadcasts() {
    const [f, setF] = useState({ title: "", body: "", url: "", segment: "all" });
    const [recipients, setRecipients] = useState(null);
    const [history, setHistory] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [scheduleOn, setScheduleOn] = useState(false);
    const [scheduledAt, setScheduledAt] = useState("");
    const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setResult(null); };

    const loadHistory = useCallback(async () => {
        try { const d = await (await fetch("/api/storefront/push")).json(); setHistory(d.error ? [] : d.broadcasts); } catch { setHistory([]); }
    }, []);
    // Re-count recipients whenever the chosen segment changes.
    useEffect(() => {
        setRecipients(null);
        fetch(`/api/storefront/push/audience?segment=${encodeURIComponent(f.segment)}`).then((r) => r.json()).then((d) => setRecipients(d.error ? 0 : d.recipients)).catch(() => setRecipients(0));
    }, [f.segment]);
    useEffect(() => { loadHistory(); }, [loadHistory]);

    const send = async () => {
        if (!f.title.trim()) { setError("Add a title."); return; }
        if (!f.body.trim()) { setError("Add a message."); return; }
        let when;
        if (scheduleOn) {
            if (!scheduledAt) { setError("Pick a date & time to schedule."); return; }
            when = new Date(scheduledAt);
            if (isNaN(when.getTime()) || when.getTime() <= Date.now()) { setError("Schedule time must be in the future."); return; }
        }
        const segLabel = PUSH_SEGMENT_LABEL[f.segment] || "app users";
        const msg = scheduleOn
            ? `Schedule this push to your ${recipients ?? 0} ${segLabel.toLowerCase()} for ${when.toLocaleString()}?`
            : `Send this push to your ${recipients ?? 0} ${segLabel.toLowerCase()} now? This goes to real buyers' phones.`;
        if (!confirm(msg)) return;
        setBusy(true); setError(null); setResult(null);
        try {
            const payload = { ...f, ...(scheduleOn ? { scheduledAt: when.toISOString() } : {}) };
            const d = await (await fetch("/api/storefront/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json();
            if (d.error) throw new Error(d.error);
            setResult(d);
            setF({ title: "", body: "", url: "", segment: f.segment });
            setScheduleOn(false); setScheduledAt("");
            loadHistory();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const cancelScheduled = async (id) => {
        if (!confirm("Cancel this scheduled push? It won't be sent.")) return;
        try {
            const d = await (await fetch(`/api/storefront/push?id=${encodeURIComponent(id)}`, { method: "DELETE" })).json();
            if (d.error) throw new Error(d.error);
            loadHistory();
        } catch (e) { setError(e.message); }
    };

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, display: "grid", gap: 12, maxWidth: 620 }}>
                <h3 style={{ margin: 0 }}>Send a push</h3>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.86rem" }}>
                    Broadcasts to app users who turned on notifications, in the chosen audience.{" "}
                    {recipients === null ? "Counting recipients…" : <b>{recipients} app user{recipients === 1 ? "" : "s"}</b>} will receive it.
                </p>
                <Field label="Audience">
                    <select style={input} value={f.segment} onChange={set("segment")}>
                        {PUSH_SEGMENT_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                </Field>
                <Field label="Title"><input style={input} placeholder="Weekend sale!" maxLength={80} value={f.title} onChange={set("title")} /></Field>
                <Field label="Message"><textarea style={{ ...input, minHeight: 70 }} placeholder="20% off everything this weekend only — tap to shop." maxLength={300} value={f.body} onChange={set("body")} /></Field>
                <Field label="Link / deep-link (optional)"><input style={input} placeholder="/collections/sale  or  https://…" value={f.url} onChange={set("url")} /></Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem", color: "#475569" }}>
                    <input type="checkbox" checked={scheduleOn} onChange={(e) => { setScheduleOn(e.target.checked); setResult(null); }} />
                    Schedule for later
                </label>
                {scheduleOn && (
                    <Field label="Send at"><input type="datetime-local" style={input} value={scheduledAt} onChange={(e) => { setScheduledAt(e.target.value); setResult(null); }} /></Field>
                )}
                {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
                {result && (result.scheduled
                    ? <div style={{ color: "#2563eb", fontSize: "0.9rem", fontWeight: 600 }}>Scheduled ✓ — for {new Date(result.scheduledAt).toLocaleString()} to ~{result.recipients} app user{result.recipients === 1 ? "" : "s"}.</div>
                    : <div style={{ color: "#16a34a", fontSize: "0.9rem", fontWeight: 600 }}>Sent ✓ — {result.sent} notification{result.sent === 1 ? "" : "s"} to {result.recipients} app user{result.recipients === 1 ? "" : "s"}.</div>)}
                <div>
                    <button onClick={send} disabled={busy || !recipients} style={{ ...btn, ...(!recipients ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}>{busy ? (scheduleOn ? "Scheduling…" : "Sending…") : (scheduleOn ? "Schedule" : "Send now")}</button>
                    {recipients === 0 && <span style={{ marginLeft: 10, color: "#94a3b8", fontSize: "0.82rem" }}>No app users with push enabled in this audience yet.</span>}
                </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
                <b style={{ fontSize: "0.9rem" }}>Recent sends</b>
                {history === null ? <div style={{ color: "#64748b" }}>Loading…</div>
                    : history.length === 0 ? <div style={card}>No pushes sent yet.</div>
                    : history.map((h) => {
                        const status = h.status || "sent";
                        const badge = status === "scheduled" ? { text: "Scheduled", color: "#2563eb" } : status === "canceled" ? { text: "Canceled", color: "#94a3b8" } : { text: "Sent", color: "#16a34a" };
                        return (
                            <div key={h._id} style={{ ...card, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ fontWeight: 700 }}>{h.title}</div>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: badge.color, border: `1px solid ${badge.color}`, borderRadius: 999, padding: "1px 8px" }}>{badge.text}</span>
                                    <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>{PUSH_SEGMENT_LABEL[h.segment] || "All app users"}</span>
                                    {status === "scheduled" && <button onClick={() => cancelScheduled(h._id)} style={{ marginLeft: "auto", border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", borderRadius: 8, padding: "3px 10px", fontSize: "0.78rem", cursor: "pointer" }}>Cancel</button>}
                                </div>
                                <div style={{ color: "#475569", fontSize: "0.86rem" }}>{h.body}</div>
                                <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 4 }}>
                                    {status === "scheduled" && h.scheduledAt
                                        ? `Scheduled for ${new Date(h.scheduledAt).toLocaleString()} · ~${h.recipients} user${h.recipients === 1 ? "" : "s"}`
                                        : `${new Date(h.createdAt).toLocaleString()} · ${h.sentCount} sent / ${h.recipients} user${h.recipients === 1 ? "" : "s"}`}
                                    {h.url ? ` · → ${h.url}` : ""}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function Field({ label, children, style }) {
    return <label style={{ display: "block", ...style }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
