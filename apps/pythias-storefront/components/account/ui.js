"use client";
import { useEffect } from "react";
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
    { href: "/account/messages", label: "Messages" },
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
        return <div className="sf-container" style={{ padding: "80px 0", textAlign: "center", color: "#64748b" }}>Loading…</div>;
    }

    return (
        <section className="sf-container" style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.6rem" }}>My Account</h1>
                    <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{customer.email}</div>
                </div>
                <button onClick={logout} style={ghostBtn}>Sign out</button>
            </div>

            <nav style={{ display: "flex", gap: 6, borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 22 }}>
                {TABS.map((t) => (
                    <a key={t.href} href={t.href} style={{
                        padding: "10px 14px", textDecoration: "none", fontWeight: 600, fontSize: "0.92rem",
                        color: active === t.href ? "var(--sf-accent, #f59e0b)" : "#475569",
                        borderBottom: active === t.href ? "2px solid var(--sf-accent, #f59e0b)" : "2px solid transparent",
                    }}>{t.label}</a>
                ))}
            </nav>

            {children}
            <ConciergeWidget />
        </section>
    );
}
