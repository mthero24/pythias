"use client";
import { useState } from "react";

// Footer newsletter signup — captures an email to the store's marketing list (POST /api/marketing/newsletter).
export default function FooterNewsletter({ config = {}, fg = "#e8eaf0" }) {
    const [email, setEmail] = useState("");
    const [state, setState] = useState("idle");   // idle | busy | done | error
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setState("busy"); setErr("");
        try {
            const r = await fetch("/api/marketing/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Could not subscribe");
            setState("done");
        } catch (e2) { setErr(e2.message); setState("error"); }
    };

    return (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 28, marginBottom: 28, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ maxWidth: 440 }}>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>{config.heading || "Join our newsletter"}</div>
                {config.subtext && <div style={{ fontSize: "0.88rem", opacity: 0.72 }}>{config.subtext}</div>}
            </div>
            {state === "done" ? (
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>✓ Thanks for subscribing!</div>
            ) : (
                <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "1 1 300px", maxWidth: 460, justifyContent: "flex-end" }}>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" aria-label="Email address"
                        style={{ flex: 1, minWidth: 200, padding: "11px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: fg, fontSize: "0.92rem" }} />
                    <button type="submit" disabled={state === "busy"}
                        style={{ padding: "11px 22px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, fontSize: "0.92rem", whiteSpace: "nowrap" }}>
                        {state === "busy" ? "…" : (config.buttonText || "Subscribe")}
                    </button>
                    {err && <div style={{ width: "100%", fontSize: "0.8rem", color: "#fca5a5", textAlign: "right" }}>{err}</div>}
                </form>
            )}
        </div>
    );
}
