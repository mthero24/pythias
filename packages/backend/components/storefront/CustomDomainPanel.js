"use client";
import { useState, useEffect } from "react";

const box = { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginTop: 10 };
const input = { padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.9rem" };
const btn = { padding: "8px 13px", borderRadius: 8, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.8rem" };

const BADGE = {
    active: { bg: "#dcfce7", fg: "#166534", label: "● Live" },
    pending: { bg: "#fef9c3", fg: "#854d0e", label: "● Pending" },
    failed: { bg: "#fee2e2", fg: "#991b1b", label: "● Failed" },
};

// Per-store custom-domain manager. Talks to /api/storefront/domains (mounted in both the
// platform and premier apps). storeId is optional — omit to target the org's primary store.
export default function CustomDomainPanel({ storeId }) {
    const [d, setD] = useState(null);
    const [host, setHost] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const q = storeId ? `?store=${storeId}` : "";

    const load = async () => {
        try { const r = await (await fetch(`/api/storefront/domains${q}`)).json(); if (!r.error) setD(r.domain); } catch { /* ignore */ }
    };
    useEffect(() => { load(); }, [storeId]); // eslint-disable-line

    const call = async (method, body) => {
        setBusy(true); setMsg("");
        try {
            const r = await (await fetch(`/api/storefront/domains${q}`, body ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { method })).json();
            if (r.error) throw new Error(r.error);
            return r;
        } catch (e) { setMsg(e.message); throw e; }
        finally { setBusy(false); }
    };

    const connect = async () => {
        if (!host.trim()) return;
        try { const r = await call("POST", { hostname: host, siteId: storeId }); setD(r.domain); setHost(""); setMsg("Domain registered — add the CNAME below, then check status."); } catch { /* shown */ }
    };
    const refresh = async () => {
        try { const r = await (await fetch(`/api/storefront/domains${q}`)).json(); if (!r.error) { setD(r.domain); setMsg(r.domain?.status === "active" ? "Connected — your store is live on this domain! 🎉" : "Still pending — DNS + SSL can take a few minutes after you add the CNAME."); } } catch { /* ignore */ }
    };
    const remove = async () => {
        if (!confirm("Disconnect this custom domain? The store will fall back to its Pythias address.")) return;
        try { await call("DELETE"); setD(null); setMsg(""); } catch { /* shown */ }
    };

    const cd = d || {};
    const badge = BADGE[cd.status] || null;

    return (
        <div style={box}>
            {!cd.hostname && (
                <>
                    <div style={{ fontWeight: 700, fontSize: "0.86rem", marginBottom: 6 }}>Connect a custom domain</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="shop.yourbrand.com" style={{ ...input, flex: 1, minWidth: 200 }} />
                        <button onClick={connect} disabled={busy} style={btn}>{busy ? "…" : "Connect domain"}</button>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.76rem", margin: "8px 0 0" }}>Use a subdomain like <b>shop.</b> or <b>www.</b> — Cloudflare issues the SSL automatically.</p>
                </>
            )}

            {cd.hostname && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ ...mono, fontWeight: 700 }}>{cd.hostname}</div>
                        {badge && <span style={{ background: badge.bg, color: badge.fg, fontSize: "0.72rem", fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{badge.label}</span>}
                    </div>

                    {cd.status !== "active" && cd.cname && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 6 }}>At your DNS provider (GoDaddy, etc.), add this record:</div>
                            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", ...mono }}>
                                <span style={{ color: "#94a3b8" }}>Type</span><span>{cd.cname.type}</span>
                                <span style={{ color: "#94a3b8" }}>Name</span><span>{cd.cname.name}</span>
                                <span style={{ color: "#94a3b8" }}>Value</span><span>{cd.cname.value}</span>
                            </div>
                            {cd.ssl?.errors?.length > 0 && <p style={{ color: "#b45309", fontSize: "0.76rem", margin: "6px 0 0" }}>SSL: {cd.ssl.errors.map((e) => e.message || e).join("; ")}</p>}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {cd.status !== "active" && <button onClick={refresh} disabled={busy} style={ghost}>{busy ? "Checking…" : "Check status"}</button>}
                        <button onClick={remove} disabled={busy} style={{ ...ghost, color: "#b91c1c" }}>Disconnect</button>
                    </div>
                </>
            )}

            {msg && <div style={{ marginTop: 8, color: msg.toLowerCase().includes("live") || msg.includes("registered") ? "#16a34a" : "#dc2626", fontSize: "0.8rem" }}>{msg}</div>}
        </div>
    );
}
