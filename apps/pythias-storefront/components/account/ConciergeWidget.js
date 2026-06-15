"use client";
import { useState, useRef, useEffect } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";

// Floating AI concierge for signed-in buyers — grounded in their own orders/returns/subscriptions.
export default function ConciergeWidget() {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! I can help with your orders, tracking, returns, and subscriptions. What do you need?" }]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const bodyRef = useRef(null);
    useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [msgs, open]);

    const send = async (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        const history = msgs.filter((m) => m.role === "user" || m.role === "assistant");
        setMsgs((m) => [...m, { role: "user", content: text }]);
        setInput(""); setBusy(true);
        try {
            const d = await (await fetch("/api/account/concierge", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ message: text, history }) })).json();
            setMsgs((m) => [...m, { role: "assistant", content: d.reply || d.error || "Sorry, something went wrong." }]);
        } catch { setMsgs((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the assistant." }]); }
        finally { setBusy(false); }
    };

    return (
        <>
            <button onClick={() => setOpen((o) => !o)} style={{ position: "fixed", bottom: 20, right: 20, zIndex: 60, borderRadius: 999, border: "none", background: "var(--sf-accent, #635bff)", color: "#fff", fontWeight: 700, padding: "12px 18px", boxShadow: "0 4px 16px rgba(0,0,0,.25)", cursor: "pointer" }}>
                {open ? "✕ Close" : "💬 Need help?"}
            </button>
            {open && (
                <div style={{ position: "fixed", bottom: 76, right: 20, zIndex: 60, width: 360, maxWidth: "calc(100vw - 40px)", height: 480, background: "#fff", borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: 800 }}>Assistant ✨</div>
                    <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gap: 10, background: "#f8fafc" }}>
                        {msgs.map((m, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                                <div style={{ maxWidth: "82%", padding: "9px 12px", borderRadius: 12, fontSize: "0.9rem", lineHeight: 1.45, whiteSpace: "pre-wrap", background: m.role === "user" ? "var(--sf-accent, #635bff)" : "#fff", color: m.role === "user" ? "#fff" : "#111", border: m.role === "user" ? "none" : "1px solid #e2e8f0" }}>{m.content}</div>
                            </div>
                        ))}
                        {busy && <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Thinking…</div>}
                    </div>
                    <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #f0f0f0" }}>
                        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about an order…" style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
                        <button type="submit" disabled={busy} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: "var(--sf-accent, #635bff)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Send</button>
                    </form>
                </div>
            )}
        </>
    );
}
