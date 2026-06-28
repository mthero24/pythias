"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const GOLD = "#D3A73D";
const GREETING = { role: "assistant", content: "Hi! I'm the Pythias assistant 👋 Ask me anything — what you sell, how it works, pricing, or whether it fits your shop. I can also connect you with Michael, our founder." };

export default function ChatWidget() {
    const [open, setOpen]       = useState(false);
    const [messages, setMessages] = useState([GREETING]);
    const [input, setInput]     = useState("");
    const [loading, setLoading] = useState(false);
    const [captured, setCaptured] = useState(false);
    const scrollRef = useRef(null);
    const pathname = usePathname();

    // Marketing pages only — keep the widget off the admin + auth surfaces.
    const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/login") || pathname?.startsWith("/register");

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open, loading]);

    async function send(e) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || loading) return;
        const next = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        setLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next.filter((m) => m !== GREETING || next.indexOf(m) > 0) }),
            });
            const data = await res.json();
            setMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, try again?" }]);
            if (data.captured) setCaptured(true);
        } catch {
            setMessages((m) => [...m, { role: "assistant", content: "Sorry — connection issue. Reach us at info@pythiastechnologies.com." }]);
        } finally {
            setLoading(false);
        }
    }

    if (hidden) return null;

    return (
        <>
            {/* Launcher button */}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Close chat" : "Chat with us"}
                style={{
                    position: "fixed", bottom: 20, right: 20, zIndex: 9998,
                    width: 60, height: 60, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: GOLD, color: "#111", boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                    fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >
                {open ? "✕" : "💬"}
            </button>

            {/* Chat panel */}
            {open && (
                <div
                    style={{
                        position: "fixed", bottom: 92, right: 20, zIndex: 9998,
                        width: "min(370px, calc(100vw - 32px))", height: "min(540px, calc(100vh - 130px))",
                        background: "#fff", borderRadius: 16, overflow: "hidden",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column",
                        fontFamily: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
                    }}
                >
                    {/* Header */}
                    <div style={{ background: "#111", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Pythias Assistant</div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>Usually replies in seconds</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px", background: "#f8faff" }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                                <div style={{
                                    maxWidth: "82%", padding: "9px 13px", borderRadius: 14, fontSize: "0.9rem", lineHeight: 1.5,
                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                    background: m.role === "user" ? GOLD : "#fff",
                                    color: m.role === "user" ? "#111" : "#1a1a1a",
                                    border: m.role === "user" ? "none" : "1px solid #e6e9f2",
                                }}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                                <div style={{ padding: "9px 13px", borderRadius: 14, background: "#fff", border: "1px solid #e6e9f2", color: "#9ca3af", fontSize: "0.9rem" }}>…</div>
                            </div>
                        )}
                        {captured && (
                            <p style={{ textAlign: "center", fontSize: "0.74rem", color: "#16a34a", margin: "4px 0" }}>
                                ✓ Got it — Michael will follow up personally.
                            </p>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eef0f5", background: "#fff" }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question…"
                            aria-label="Your message"
                            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #d7dbe6", fontSize: "0.9rem", outline: "none" }}
                        />
                        <button type="submit" disabled={loading || !input.trim()} style={{
                            padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer",
                            background: GOLD, color: "#111", fontWeight: 700, fontSize: "0.9rem", opacity: loading || !input.trim() ? 0.6 : 1,
                        }}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
