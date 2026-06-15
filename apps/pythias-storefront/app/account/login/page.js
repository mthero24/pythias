"use client";
import { useState } from "react";
import { useCustomer } from "@/components/account/CustomerProvider";
import { inputSx, primaryBtn, card } from "@/components/account/ui";

const CONSENT_TEXT = {
    email: "I agree to receive marketing emails. I can unsubscribe anytime.",
    sms: "I agree to receive marketing texts (msg & data rates may apply). Reply STOP to opt out.",
};

function nextUrl() {
    if (typeof window === "undefined") return "/account";
    const n = new URLSearchParams(window.location.search).get("next");
    return n ? decodeURIComponent(n) : "/account";
}

export default function LoginPage() {
    const { login, signup } = useCustomer();
    const [mode, setMode] = useState("login");        // login | signup
    const [f, setF] = useState({ email: "", password: "", name: "", phone: "", emailOptIn: false, smsOptIn: false });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        try {
            if (mode === "login") {
                await login(f.email, f.password);
            } else {
                await signup({
                    email: f.email, password: f.password, name: f.name, phone: f.phone,
                    consent: {
                        email: { optedIn: f.emailOptIn, text: CONSENT_TEXT.email },
                        sms: { optedIn: f.smsOptIn, text: CONSENT_TEXT.sms },
                    },
                });
            }
            window.location.href = nextUrl();
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };

    const isSignup = mode === "signup";
    return (
        <section className="sf-container" style={{ maxWidth: 440, margin: "0 auto", padding: "56px 20px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 22, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
                {["login", "signup"].map((m) => (
                    <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
                        flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.92rem",
                        background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111" : "#64748b",
                        boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                    }}>{m === "login" ? "Sign in" : "Create account"}</button>
                ))}
            </div>

            <form onSubmit={submit} style={{ ...card, display: "grid", gap: 13 }}>
                <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>{isSignup ? "Create your account" : "Welcome back"}</h1>
                {isSignup && <input style={inputSx} placeholder="Full name" value={f.name} onChange={set("name")} />}
                <input style={inputSx} type="email" placeholder="Email" value={f.email} onChange={set("email")} required />
                <input style={inputSx} type="password" placeholder={isSignup ? "Password (8+ characters)" : "Password"} value={f.password} onChange={set("password")} required />
                {isSignup && <input style={inputSx} placeholder="Phone (optional)" value={f.phone} onChange={set("phone")} />}

                {isSignup && (
                    <div style={{ display: "grid", gap: 8, fontSize: "0.86rem", color: "#475569" }}>
                        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                            <input type="checkbox" checked={f.emailOptIn} onChange={set("emailOptIn")} style={{ marginTop: 3 }} />
                            <span>{CONSENT_TEXT.email}</span>
                        </label>
                        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                            <input type="checkbox" checked={f.smsOptIn} onChange={set("smsOptIn")} style={{ marginTop: 3 }} />
                            <span>{CONSENT_TEXT.sms}</span>
                        </label>
                    </div>
                )}

                {error && <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</div>}
                <button type="submit" disabled={busy} style={primaryBtn}>
                    {busy ? "…" : isSignup ? "Create account" : "Sign in"}
                </button>
                <a href="/products" style={{ textAlign: "center", color: "#64748b", fontSize: "0.88rem", textDecoration: "none" }}>← Continue shopping</a>
            </form>
        </section>
    );
}
