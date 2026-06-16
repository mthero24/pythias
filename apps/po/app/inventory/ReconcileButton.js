"use client";
import { useState } from "react";

// Reconcile the per-item "ordered" flag back to authoritative active-PO truth.
// Dry-run first (no writes) to preview the delta, then Apply.
export default function ReconcileButton() {
    const [out, setOut] = useState(null);
    const [busy, setBusy] = useState(false);

    async function run(method, label) {
        setBusy(true);
        setOut(`${label}…`);
        try {
            const res = await fetch("/api/admin/inventory/reconcile-ordered", { method });
            const json = await res.json();
            setOut(json.report ? JSON.stringify(json.report, null, 2) : JSON.stringify(json, null, 2));
        } catch (e) {
            setOut(`Failed: ${e.message}`);
        } finally {
            setBusy(false);
        }
    }

    const btn = { padding: "7px 13px", borderRadius: 8, border: "1px solid #2563eb", background: "transparent", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: 13 };
    const apply = { ...btn, background: "#2563eb", color: "#fff" };

    return (
        <div style={{ margin: "10px 16px", padding: 12, border: "1px dashed #2563eb", borderRadius: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>On-Order Reconcile</div>
            <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 12 }}>
                Fixes items stuck marked “ordered” that aren’t on an active PO (collapses the inflated “on order” count to PO truth).
            </p>
            <div style={{ display: "flex", gap: 8 }}>
                <button style={btn} disabled={busy} onClick={() => run("GET", "Checking")}>Dry Run (preview)</button>
                <button style={apply} disabled={busy} onClick={() => run("POST", "Applying")}>Apply Fix</button>
            </div>
            {out && (
                <pre style={{ marginTop: 10, padding: 10, background: "#0f172a", color: "#e2e8f0", borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 260 }}>
                    {out}
                </pre>
            )}
        </div>
    );
}
