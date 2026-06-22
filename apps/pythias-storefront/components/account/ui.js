"use client";
import { useEffect, useState, useRef } from "react";
import { useCustomer } from "./CustomerProvider";
import ConciergeWidget from "./ConciergeWidget";

export const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

export const inputSx = { width: "100%", padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.95rem", boxSizing: "border-box" };
export const primaryBtn = { padding: "13px 18px", borderRadius: 10, border: "none", background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" };
export const ghostBtn = { padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", color: "#111", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none", display: "inline-block" };
export const card = { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 18 };

const STATUS_COLORS = {
    shipped: { bg: "#dbeafe", fg: "#1e40af" }, delivered: { bg: "#dcfce7", fg: "#166534" },
    in_production: { bg: "#fef9c3", fg: "#854d0e" }, awaiting_shipment: { bg: "#f1f5f9", fg: "#475569" },
    cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};
export function StatusBadge({ status }) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.awaiting_shipment;
    const label = String(status || "pending").replace(/_/g, " ");
    return <span style={{ background: c.bg, color: c.fg, fontWeight: 600, fontSize: "0.78rem", padding: "3px 10px", borderRadius: 999, textTransform: "capitalize" }}>{label}</span>;
}

const TABS = [
    { href: "/account", label: "Overview" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/subscriptions", label: "Subscriptions" },
    { href: "/account/returns", label: "Returns" },
    { href: "/account/designs", label: "My Designs" },
    { href: "/account/images", label: "My Images" },
    { href: "/account/messages", label: "Messages" },
    { href: "/account/password", label: "Password" },
];

// Auth-gating wrapper for every account page. Redirects to login when signed out, renders
// a consistent header + nav. `active` highlights the current tab.
export function AccountShell({ active, children }) {
    const { customer, ready, logout } = useCustomer();

    useEffect(() => {
        if (ready && !customer && typeof window !== "undefined") {
            const next = encodeURIComponent(window.location.pathname);
            window.location.href = `/account/login?next=${next}`;
        }
    }, [ready, customer]);

    if (!ready || !customer) {
        return <div className="sf-container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center", color: "#64748b" }}>Loading…</div>;
    }

    return (
        <section className="sf-container" style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.6rem" }}>My Account</h1>
                    <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{customer.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <a href="/" style={ghostBtn}>← Back to shopping</a>
                    <button onClick={logout} style={ghostBtn}>Sign out</button>
                </div>
            </div>

            <AccountNav active={active} />

            {children}
            <ConciergeWidget />
        </section>
    );
}

// Account section nav — horizontal tabs on desktop, a tap-to-open dropdown menu on mobile (so the
// 7 tabs never overflow / get cut off on a phone).
function AccountNav({ active }) {
    const [mobile, setMobile] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const on = () => setMobile(mq.matches);
        on(); mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const tabColor = (t) => (active === t.href ? "var(--sf-accent, #f59e0b)" : "#475569");

    if (mobile) {
        const current = TABS.find((t) => t.href === active) || TABS[0];
        return (
            <div ref={ref} style={{ position: "relative", marginBottom: 22 }}>
                <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.14)",
                    background: "#fff", color: "var(--sf-text, #111)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: "1.05rem" }}>☰</span>{current.label}</span>
                    <span style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>▾</span>
                </button>
                {open && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", zIndex: 30, overflow: "hidden" }}>
                        {TABS.map((t) => (
                            <a key={t.href} href={t.href} style={{
                                display: "block", padding: "12px 16px", textDecoration: "none", fontWeight: 600, fontSize: "0.92rem",
                                color: tabColor(t), background: active === t.href ? "rgba(0,0,0,0.04)" : "transparent",
                                borderLeft: active === t.href ? "3px solid var(--sf-accent, #f59e0b)" : "3px solid transparent",
                            }}>{t.label}</a>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <nav style={{ display: "flex", gap: 6, borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 22, flexWrap: "wrap" }}>
            {TABS.map((t) => (
                <a key={t.href} href={t.href} style={{
                    padding: "10px 14px", textDecoration: "none", fontWeight: 600, fontSize: "0.92rem", whiteSpace: "nowrap",
                    color: tabColor(t), borderBottom: active === t.href ? "2px solid var(--sf-accent, #f59e0b)" : "2px solid transparent",
                }}>{t.label}</a>
            ))}
        </nav>
    );
}
