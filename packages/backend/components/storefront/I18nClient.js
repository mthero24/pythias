"use client";
import { useEffect, useState } from "react";

const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" };

export default function I18nClient() {
    const [cfg, setCfg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const [translating, setTranslating] = useState("");
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        fetch("/api/storefront/i18n").then((r) => r.json()).then((d) => setCfg({
            defaultCurrency: d.i18n?.defaultCurrency || "USD",
            currencies: d.i18n?.currencies?.length ? d.i18n.currencies : [{ code: "USD", symbol: "$", rate: 1 }],
            defaultLang: d.i18n?.defaultLang || "en",
            languages: d.i18n?.languages || [],
        })).catch(() => setCfg({ defaultCurrency: "USD", currencies: [{ code: "USD", symbol: "$", rate: 1 }], defaultLang: "en", languages: [] }));
    }, []);

    if (!cfg) return <div style={{ padding: 28, color: "#64748b" }}>Loading…</div>;
    const upd = (patch) => { setCfg((c) => ({ ...c, ...patch })); setSaved(false); };
    const setCur = (i, k, v) => upd({ currencies: cfg.currencies.map((c, j) => j === i ? { ...c, [k]: k === "rate" ? Number(v) : v } : c) });

    const save = async () => {
        setBusy(true);
        try { await fetch("/api/storefront/i18n", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) }); setSaved(true); }
        finally { setBusy(false); }
    };
    const translate = async (lang) => {
        setTranslating(lang); setMsg(null);
        try { const d = await (await fetch("/api/storefront/i18n/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang }) })).json();
            if (d.error) throw new Error(d.error);
            setMsg(`Translated ${d.translated} strings to ${lang.toUpperCase()}.`);
            if (!cfg.languages.includes(lang)) upd({ languages: [...cfg.languages, lang] });
        } catch (e) { setMsg(e.message); } finally { setTranslating(""); }
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", display: "grid", gap: 14 }}>
            <div><h1 style={{ margin: 0 }}>International</h1><p style={{ color: "#64748b", margin: "2px 0 0" }}>Sell in multiple currencies and languages. Prices are stored in your base currency and shown converted.</p></div>

            <div style={{ ...card, display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Currencies</h3>
                <label style={{ fontSize: "0.82rem", color: "#64748b" }}>Base currency<input style={{ ...input, marginTop: 4, maxWidth: 120 }} value={cfg.defaultCurrency} onChange={(e) => upd({ defaultCurrency: e.target.value.toUpperCase() })} /></label>
                {cfg.currencies.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input style={{ ...input, width: 90 }} placeholder="USD" value={c.code} onChange={(e) => setCur(i, "code", e.target.value.toUpperCase())} />
                        <input style={{ ...input, width: 70 }} placeholder="$" value={c.symbol} onChange={(e) => setCur(i, "symbol", e.target.value)} />
                        <input style={{ ...input, width: 120 }} type="number" step="0.0001" placeholder="rate" value={c.rate} onChange={(e) => setCur(i, "rate", e.target.value)} />
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>per 1 {cfg.defaultCurrency}</span>
                        <button onClick={() => upd({ currencies: cfg.currencies.filter((_, j) => j !== i) })} style={{ ...ghost, color: "#dc2626" }}>×</button>
                    </div>
                ))}
                <button onClick={() => upd({ currencies: [...cfg.currencies, { code: "", symbol: "", rate: 1 }] })} style={ghost}>+ Add currency</button>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Note: checkout currently charges in your base currency; converted prices are for display.</div>
            </div>

            <div style={{ ...card, display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Languages</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ ...ghost, cursor: "default", background: "#eef2ff", borderColor: "#635bff", color: "#635bff" }}>EN (default)</span>
                    {cfg.languages.map((l) => <span key={l} style={{ ...ghost, cursor: "default" }}>{l.toUpperCase()}<button onClick={() => upd({ languages: cfg.languages.filter((x) => x !== l) })} style={{ marginLeft: 6, border: "none", background: "none", color: "#dc2626", cursor: "pointer" }}>×</button></span>)}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>✨ Add + AI-translate the UI to:</span>
                    {["es", "fr", "de", "it", "pt", "ja"].map((l) => (
                        <button key={l} onClick={() => translate(l)} disabled={!!translating} style={ghost}>{translating === l ? "…" : l.toUpperCase()}</button>
                    ))}
                </div>
                {msg && <div style={{ fontSize: "0.85rem", color: msg.startsWith("Translated") ? "#16a34a" : "#dc2626" }}>{msg}</div>}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Save"}</button>
                {saved && <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.88rem" }}>Saved ✓</span>}
            </div>
        </div>
    );
}
