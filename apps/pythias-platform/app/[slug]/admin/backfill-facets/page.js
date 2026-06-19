"use client";
// TEMP: one-click trigger for the Atlas facet backfill (POST /api/admin/backfill/facets). Idempotent +
// re-runnable. Safe to delete this folder once the backfill has been run for every org.
import { useState } from "react";

export default function BackfillFacetsPage() {
    const [state, setState] = useState({ loading: false, result: null, error: null });

    const run = async () => {
        setState({ loading: true, result: null, error: null });
        try {
            const r = await fetch("/api/admin/backfill/facets", { method: "POST" });
            const d = await r.json();
            if (d.error) setState({ loading: false, result: null, error: d.msg || "Failed" });
            else setState({ loading: false, result: d, error: null });
        } catch (e) {
            setState({ loading: false, result: null, error: e.message });
        }
    };

    return (
        <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Backfill Atlas facet fields</h1>
            <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
                Populates <code>facetColors</code>, <code>facetSizes</code> and <code>minPriceCents</code> on all
                products in <strong>your org</strong> so server-side faceted search works. Idempotent — safe to run again.
            </p>
            <button onClick={run} disabled={state.loading}
                style={{ padding: "12px 22px", borderRadius: 8, border: "none", cursor: state.loading ? "default" : "pointer",
                    background: state.loading ? "#9ca3af" : "#2563eb", color: "#fff", fontSize: "1rem", fontWeight: 600 }}>
                {state.loading ? "Running…" : "Run backfill"}
            </button>

            {state.result && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
                    ✓ Done — scanned {state.result.scanned}, updated {state.result.updated} product(s).
                    <div style={{ marginTop: 8, fontSize: "0.9rem" }}>
                        Sizes still unresolved (look like an id): <strong>{state.result.unresolvedSizes ?? 0}</strong>
                    </div>
                    {state.result.sample?.length > 0 && (
                        <pre style={{ marginTop: 10, padding: 10, background: "#fff", borderRadius: 6, fontSize: "0.78rem", overflowX: "auto", color: "#374151" }}>
                            {JSON.stringify(state.result.sample, null, 2)}
                        </pre>
                    )}
                </div>
            )}
            {state.error && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                    ✗ {state.error}
                </div>
            )}
        </div>
    );
}
