"use client";
import { useEffect, useState } from "react";
import { useExperiment } from "@/components/experiments/ExperimentProvider";

// Thin sale/announcement bar above the site header. The offer comes from a running "sale" A/B test
// (the assigned variant's config) if one exists, otherwise from the site's persisted announcement
// (window.__SF__.announcement — published by SiteScripts; also where a promoted sale winner lands).
// Dismissible per session. Conversions are attributed automatically (the tracker credits the visitor's
// bucketed experiments on purchase).
export default function SaleBar() {
    const { ready, configFor } = useExperiment();
    const [dismissed, setDismissed] = useState(true);   // start hidden → avoid SSR/first-paint flash
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        try { setDismissed(sessionStorage.getItem("sf_salebar_x") === "1"); } catch { setDismissed(false); }
    }, []);

    useEffect(() => {
        if (!ready) return;
        const exp = configFor("sale");                  // {} when no running sale test
        const fallback = (typeof window !== "undefined" && window.__SF__?.announcement) || null;
        const chosen = exp && exp.message ? exp : fallback;
        setOffer(chosen && chosen.message ? chosen : null);
    }, [ready, configFor]);

    if (dismissed || !offer?.message) return null;

    const bg = offer.bg || "var(--sf-accent)";
    const fg = offer.fg || "#ffffff";
    const close = () => { try { sessionStorage.setItem("sf_salebar_x", "1"); } catch { /* ignore */ } setDismissed(true); };
    const Inner = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <span>{offer.message}</span>
            {offer.code ? <CodePill code={offer.code} fg={fg} /> : null}
        </span>
    );

    return (
        <div style={{ background: bg, color: fg, fontSize: "0.86rem", fontWeight: 600, position: "relative" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 40px 8px 16px", textAlign: "center" }}>
                {offer.link ? <a href={offer.link} style={{ color: fg, textDecoration: "none" }}>{Inner}</a> : Inner}
            </div>
            <button onClick={close} aria-label="Dismiss" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: fg, cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, opacity: 0.8 }}>×</button>
        </div>
    );
}

function CodePill({ code, fg }) {
    const [copied, setCopied] = useState(false);
    const copy = (e) => {
        e.preventDefault();
        try { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
    };
    return (
        <button onClick={copy} title="Copy code" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", color: fg, border: `1px dashed ${fg}`, borderRadius: 6, padding: "2px 8px", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>
            {copied ? "Copied!" : <>Code: {code}</>}
        </button>
    );
}
