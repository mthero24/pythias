"use client";
import { useState } from "react";

// Per-org integration debug hub (platform). Read-only diagnostics for the logged-in org's
// connections — orders + listing. Hidden behind ?debug=1. No "run pull" button here: the
// cron pull is global/per-org and shouldn't be fired from one tenant's debug screen.
export default function IntegrationDebugHub() {
    const [out, setOut] = useState(null);
    const [busy, setBusy] = useState(false);
    const [label, setLabel] = useState("");
    const [tp, setTp] = useState({ marketplace: "tiktok", connectionId: "", productId: "" });

    async function call(qs, lbl) {
        setBusy(true);
        setLabel(lbl);
        setOut(null);
        try {
            const res = await fetch(`/api/internal/integrations/diagnose${qs}`);
            setOut(await res.json());
        } catch (e) {
            setOut({ error: true, msg: e.message });
        } finally {
            setBusy(false);
        }
    }

    async function testPush() {
        if (!tp.productId) { setOut({ error: true, msg: "productId required" }); return; }
        setBusy(true);
        setLabel(`Test-pushing to ${tp.marketplace}`);
        setOut(null);
        try {
            const res = await fetch(`/api/internal/integrations/test-push`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tp),
            });
            setOut(await res.json());
        } catch (e) {
            setOut({ error: true, msg: e.message });
        } finally {
            setBusy(false);
        }
    }

    const ghost = { padding: "8px 14px", borderRadius: 8, border: "1px solid #D3A73D", background: "transparent", color: "#D3A73D", fontWeight: 700, cursor: "pointer" };
    const btn = { ...ghost, background: "#D3A73D", color: "#0f172a" };
    const input = { padding: "7px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13 };

    return (
        <div style={{ margin: 24, padding: 20, border: "1px dashed #D3A73D", borderRadius: 12 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Integration Debug Hub</h2>
            <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: 13 }}>
                Read-only diagnostics for this organization&apos;s integrations — orders and listing.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={ghost} disabled={busy} onClick={() => call("", "Diagnosing all")}>Diagnose All</button>
                <button style={ghost} disabled={busy} onClick={() => call("?surface=orders", "Diagnosing orders")}>Orders Only</button>
                <button style={ghost} disabled={busy} onClick={() => call("?surface=listing", "Diagnosing listing")}>Listing Only</button>
                <button style={ghost} disabled={busy} onClick={() => call("?includeDisabled=1", "Diagnosing (incl. disabled)")}>Incl. Disabled</button>
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Listing Test-Push</div>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 12 }}>
                    ⚠ Real push. Currently wired for TikTok on the platform; other marketplaces report status only.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select style={input} value={tp.marketplace} onChange={e => setTp({ ...tp, marketplace: e.target.value })}>
                        {["tiktok", "walmart", "faire", "amazon", "ebay", "acenda", "etsy", "shopify"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input style={{ ...input, width: 220 }} placeholder="connectionId (optional)" value={tp.connectionId} onChange={e => setTp({ ...tp, connectionId: e.target.value })} />
                    <input style={{ ...input, width: 220 }} placeholder="productId" value={tp.productId} onChange={e => setTp({ ...tp, productId: e.target.value })} />
                    <button style={btn} disabled={busy} onClick={testPush}>Test Push</button>
                </div>
            </div>

            {busy && <p style={{ marginTop: 12, color: "#D3A73D" }}>{label}…</p>}
            {out && (
                <pre style={{ marginTop: 12, padding: 12, background: "#0f172a", color: "#e2e8f0", borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 560 }}>
                    {JSON.stringify(out, null, 2)}
                </pre>
            )}
        </div>
    );
}
