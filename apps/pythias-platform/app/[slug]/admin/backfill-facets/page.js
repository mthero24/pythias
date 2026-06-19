"use client";
// TEMP: one-click triggers for admin backfills. Idempotent + re-runnable. Safe to delete this folder
// once each backfill has been run for every org.
import { useState } from "react";

function BackfillButton({ title, desc, endpoint, render }) {
    const [state, setState] = useState({ loading: false, result: null, error: null });
    const run = async () => {
        setState({ loading: true, result: null, error: null });
        try {
            const d = await (await fetch(endpoint, { method: "POST" })).json();
            if (d.error) setState({ loading: false, result: null, error: d.msg || "Failed" });
            else setState({ loading: false, result: d, error: null });
        } catch (e) { setState({ loading: false, result: null, error: e.message }); }
    };
    return (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 6px" }}>{title}</h2>
            <p style={{ color: "#555", lineHeight: 1.6, margin: "0 0 16px", fontSize: "0.92rem" }}>{desc}</p>
            <button onClick={run} disabled={state.loading}
                style={{ padding: "11px 20px", borderRadius: 8, border: "none", cursor: state.loading ? "default" : "pointer",
                    background: state.loading ? "#9ca3af" : "#2563eb", color: "#fff", fontSize: "0.95rem", fontWeight: 600 }}>
                {state.loading ? "Running…" : "Run"}
            </button>
            {state.result && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
                    ✓ Done — scanned {state.result.scanned}, updated {state.result.updated} product(s).
                    {render && render(state.result)}
                </div>
            )}
            {state.error && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>✗ {state.error}</div>
            )}
        </div>
    );
}

export default function AdminBackfillsPage() {
    return (
        <div style={{ maxWidth: 620, margin: "60px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1 style={{ fontSize: "1.4rem", marginBottom: 18 }}>Admin backfills</h1>

            <BackfillButton
                title="Atlas facet fields"
                desc="Populates facetColors, facetSizes and minPriceCents on all products in your org so server-side faceted search works."
                endpoint="/api/admin/backfill/facets"
                render={(r) => (
                    <>
                        <div style={{ marginTop: 8, fontSize: "0.9rem" }}>Sizes still unresolved (look like an id): <strong>{r.unresolvedSizes ?? 0}</strong></div>
                        {r.sample?.length > 0 && <pre style={{ marginTop: 10, padding: 10, background: "#fff", borderRadius: 6, fontSize: "0.78rem", overflowX: "auto", color: "#374151" }}>{JSON.stringify(r.sample, null, 2)}</pre>}
                    </>
                )}
            />

            <BackfillButton
                title="Compare-at prices"
                desc="Copies each blank size's compare-at price onto the product's matching variant, so existing products show the sale/strikethrough without a re-save."
                endpoint="/api/admin/backfill/compare-at"
            />
        </div>
    );
}
