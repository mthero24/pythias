"use client";
import { useState } from "react";

// TEMP debug widget — diagnose why TikTok orders aren't pulling, and trigger a real pull.
// Safe to delete once the TikTok pull is confirmed working.
export default function TikTokPullTest() {
    const [out, setOut] = useState(null);
    const [busy, setBusy] = useState(false);

    async function call(qs, label) {
        setBusy(true);
        setOut(`${label}…`);
        try {
            const res = await fetch(`/api/internal/pull-orders/tiktok${qs}`);
            const json = await res.json();
            setOut(JSON.stringify(json, null, 2));
        } catch (e) {
            setOut(`Request failed: ${e.message}`);
        } finally {
            setBusy(false);
        }
    }

    const btn = { padding: "8px 14px", borderRadius: 8, border: "1px solid #D3A73D", background: "#D3A73D", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
    const ghost = { ...btn, background: "transparent", color: "#D3A73D" };

    return (
        <div style={{ margin: "16px 24px", padding: 16, border: "1px dashed #D3A73D", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>TikTok Pull — Debug (temp)</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={ghost} disabled={busy} onClick={() => call("", "Diagnosing")}>Diagnose (read-only)</button>
                <button style={btn} disabled={busy} onClick={() => call("?pull=1", "Pulling")}>Run Pull Now</button>
            </div>
            {out && (
                <pre style={{ marginTop: 12, padding: 12, background: "#0f172a", color: "#e2e8f0", borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 420 }}>
                    {out}
                </pre>
            )}
        </div>
    );
}
