"use client";
import { useState } from "react";

// Collapsible details section for the product page (Description / Shipping / Returns).
export default function Accordion({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderTop: "1px solid var(--sf-border, #e5e7eb)" }}>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "18px 0", color: "var(--sf-text)", font: "inherit" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{title}</span>
                <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{open ? "–" : "+"}</span>
            </button>
            {open && <div style={{ padding: "0 0 22px", lineHeight: 1.8, fontSize: "0.96rem", color: "var(--sf-text)", opacity: 0.92 }}>{children}</div>}
        </div>
    );
}
