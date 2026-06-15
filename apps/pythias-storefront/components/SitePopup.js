"use client";
import { useEffect, useState } from "react";
import { useCustomer } from "@/components/account/CustomerProvider";

// Seller-configurable signup popup for visitors who aren't signed in. Collects email (+ optional
// phone) with marketing consent, in exchange for the configured discount. Dismissal + success
// are remembered in localStorage so it isn't shown repeatedly.
const DISMISS_KEY = "sf_popup_v1";

export default function SitePopup() {
    const { customer, ready } = useCustomer();
    const [cfg, setCfg] = useState(null);
    const [show, setShow] = useState(false);
    const [f, setF] = useState({ email: "", phone: "", emailOptIn: true, smsOptIn: false });
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);   // { code }
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!ready || customer) return;                       // only for logged-out visitors
        if (localStorage.getItem(DISMISS_KEY)) return;        // already dismissed / subscribed
        let timer;
        fetch("/api/site/popup").then((r) => r.json()).then((d) => {
            if (!d?.enabled) return;
            setCfg(d);
            timer = setTimeout(() => setShow(true), Math.max(0, (d.delaySeconds ?? 5) * 1000));
        }).catch(() => {});
        return () => clearTimeout(timer);
    }, [ready, customer]);

    const close = () => { setShow(false); try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ } };
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        try {
            const r = await fetch("/api/marketing/subscribe", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: f.email, phone: cfg.collectPhone ? f.phone : undefined, emailOptIn: f.emailOptIn, smsOptIn: f.smsOptIn }),
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            setDone({ code: d.code });
            try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };

    if (!show || !cfg) return null;

    return (
        <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 420, width: "100%", padding: 26, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
                <button onClick={close} aria-label="Close" style={{ position: "absolute", top: 12, right: 14, border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>×</button>

                {done ? (
                    <div style={{ textAlign: "center" }}>
                        <h2 style={{ margin: "4px 0 10px" }}>You're in! 🎉</h2>
                        {done.code
                            ? <><p style={{ color: "#475569" }}>Use this code at checkout:</p>
                                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, margin: "10px 0", padding: "10px", background: "#f1f5f9", borderRadius: 8 }}>{done.code}</div>
                                <p style={{ fontSize: "0.84rem", color: "#94a3b8" }}>We also emailed it to you.</p></>
                            : <p style={{ color: "#475569" }}>Thanks for subscribing — check your inbox.</p>}
                        <button onClick={close} style={{ marginTop: 14, padding: "11px 20px", borderRadius: 9, border: "none", background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Start shopping</button>
                    </div>
                ) : (
                    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
                        <h2 style={{ margin: "0 0 2px", fontSize: "1.4rem" }}>{cfg.headline}</h2>
                        {cfg.body && <p style={{ margin: 0, color: "#475569", fontSize: "0.92rem" }}>{cfg.body}</p>}
                        <input type="email" required placeholder="Email address" value={f.email} onChange={set("email")}
                            style={{ padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.95rem" }} />
                        {cfg.collectPhone && (
                            <input type="tel" required={cfg.requirePhone} placeholder={`Phone${cfg.requirePhone ? "" : " (optional)"}`} value={f.phone} onChange={set("phone")}
                                style={{ padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.95rem" }} />
                        )}
                        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.8rem", color: "#475569" }}>
                            <input type="checkbox" checked={f.emailOptIn} onChange={set("emailOptIn")} style={{ marginTop: 2 }} />
                            <span>{cfg.emailConsentText}</span>
                        </label>
                        {cfg.collectPhone && (
                            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.8rem", color: "#475569" }}>
                                <input type="checkbox" checked={f.smsOptIn} onChange={set("smsOptIn")} style={{ marginTop: 2 }} />
                                <span>{cfg.smsConsentText}</span>
                            </label>
                        )}
                        {error && <div style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</div>}
                        <button type="submit" disabled={busy} style={{ padding: "13px", borderRadius: 10, border: "none", background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}>
                            {busy ? "…" : (cfg.buttonText || "Sign up")}
                        </button>
                        <button type="button" onClick={close} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.82rem" }}>No thanks</button>
                    </form>
                )}
            </div>
        </div>
    );
}
