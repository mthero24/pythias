"use client";
import { useEffect, useState } from "react";
import { SpecialPage, SPECIAL_DEFAULTS } from "@pythias/storefront";

// Runtime error boundary. It's a client component (can't resolve the site server-side), so it pulls the
// seller's custom copy from a tiny public endpoint; falls back to defaults if that fails.
export default function StoreError({ error, reset }) {
    const [c, setC] = useState({});
    useEffect(() => {
        fetch("/api/site-content").then((r) => r.json()).then((d) => setC(d?.error || {})).catch(() => {});
    }, []);

    const d = SPECIAL_DEFAULTS.error;
    return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
            <SpecialPage
                title={c.title || d.title}
                message={c.message || d.message}
                ctaText={c.ctaText || d.ctaText}
                onCta={() => reset()} />
        </div>
    );
}
