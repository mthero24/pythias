"use client";
import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function GiftCardBalance() {
    const { price } = useI18n();
    const [code, setCode] = useState("");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);

    const check = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true); setResult(null);
        try {
            const d = await (await fetch(`/api/giftcards/check?code=${encodeURIComponent(code.trim())}`)).json();
            setResult(d);
        } catch { setResult({ valid: false }); }
        finally { setBusy(false); }
    };

    return (
        <div>
            <form onSubmit={check} style={{ display: "flex", gap: 8 }}>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Gift card code" style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", fontSize: "1rem", textTransform: "uppercase" }} />
                <button type="submit" disabled={busy} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy ? "…" : "Check"}</button>
            </form>
            {result && (
                <div style={{ marginTop: 18, padding: 16, borderRadius: 10, background: result.valid ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.valid ? "#bbf7d0" : "#fecaca"}` }}>
                    {result.valid
                        ? <div>Balance: <b style={{ fontSize: "1.4rem" }}>{price(result.balanceCents)}</b></div>
                        : <div style={{ color: "#991b1b" }}>That gift card isn’t valid{result.reason === "empty" ? " (no balance left)" : result.reason === "expired" ? " (expired)" : ""}.</div>}
                </div>
            )}
        </div>
    );
}
