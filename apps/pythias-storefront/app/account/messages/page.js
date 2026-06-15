"use client";
import { useEffect, useState, useCallback } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, fmtDate, card, ghostBtn, primaryBtn, inputSx } from "@/components/account/ui";

export default function MessagesPage() {
    return <AccountShell active="/account/messages"><Messages /></AccountShell>;
}

function Messages() {
    const [threads, setThreads] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [composing, setComposing] = useState(false);

    const load = useCallback(async () => {
        try {
            const d = await (await fetch("/api/account/messages", { headers: authHeaders() })).json();
            setThreads(d.error ? [] : d.threads);
        } catch { setThreads([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    if (threads === null) return <div style={{ color: "#64748b" }}>Loading…</div>;

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {!composing && <button onClick={() => setComposing(true)} style={primaryBtn}>New message</button>}
            </div>

            {composing && <NewThread onDone={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />}

            {threads.length === 0 && !composing && <div style={card}>No messages yet.</div>}

            {threads.map((t) => (
                <div key={t.id} style={card}>
                    <div onClick={() => setOpenId(openId === t.id ? null : t.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{t.subject}</div>
                            <div style={{ color: "#64748b", fontSize: "0.82rem" }}>{fmtDate(t.lastMessageAt)} · {t.status}</div>
                        </div>
                        <span style={{ color: "#64748b" }}>{openId === t.id ? "▲" : "▼"}</span>
                    </div>
                    {openId === t.id && <Thread thread={t} onReplied={load} />}
                </div>
            ))}
        </div>
    );
}

function Thread({ thread, onReplied }) {
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);

    const reply = async () => {
        if (!body.trim()) return;
        setBusy(true);
        try {
            await fetch(`/api/account/messages/${thread.id}`, {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ body }),
            });
            setBody(""); onReplied();
        } finally { setBusy(false); }
    };

    return (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12, display: "grid", gap: 8 }}>
            {(thread.messages || []).map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "customer" ? "flex-end" : "flex-start" }}>
                    <div style={{
                        maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: "0.9rem",
                        background: m.from === "customer" ? "var(--sf-accent, #f59e0b)" : "#f1f5f9",
                        color: m.from === "customer" ? "#fff" : "#111",
                    }}>
                        {m.body}
                        <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: 2 }}>{fmtDate(m.at)}</div>
                    </div>
                </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input style={{ ...inputSx, flex: 1 }} placeholder="Reply…" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reply()} />
                <button onClick={reply} disabled={busy} style={ghostBtn}>{busy ? "…" : "Send"}</button>
            </div>
        </div>
    );
}

function NewThread({ onDone, onCancel }) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const send = async () => {
        if (!body.trim()) { setError("Please enter a message."); return; }
        setBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/account/messages", {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ subject: subject.trim() || "Customer inquiry", body }),
            })).json();
            if (d.error) throw new Error(d.error);
            onDone();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    return (
        <div style={{ ...card, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>New message</h3>
            <input style={inputSx} placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea style={{ ...inputSx, minHeight: 90, resize: "vertical" }} placeholder="Your message" value={body} onChange={(e) => setBody(e.target.value)} />
            {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={send} disabled={busy} style={primaryBtn}>{busy ? "Sending…" : "Send"}</button>
                <button onClick={onCancel} style={ghostBtn}>Cancel</button>
            </div>
        </div>
    );
}
