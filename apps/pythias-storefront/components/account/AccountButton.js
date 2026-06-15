"use client";
import { useCustomer } from "./CustomerProvider";

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

// Account button for the header cluster. Shows "Sign in" when logged out, or the buyer's
// name + rewards balance when logged in. Always renders inline (inside HeaderControls).
export default function AccountButton() {
    const { customer, ready } = useCustomer();
    if (!ready) return null;

    const base = {
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.95)", color: "#111", fontWeight: 700,
        padding: "8px 14px", borderRadius: 999, boxShadow: "0 2px 10px rgba(0,0,0,.18)",
        fontSize: "0.9rem", textDecoration: "none", border: "1px solid rgba(0,0,0,0.06)",
    };

    if (!customer) {
        return <a href="/account/login" style={base}>👤 Sign in</a>;
    }

    const label = customer.name?.trim()?.split(" ")[0] || "Account";
    return (
        <a href="/account" style={base} title={customer.email}>
            👤 {label}
            {customer.rewardsBalance > 0 && (
                <span style={{ background: "var(--sf-secondary, #16a34a)", color: "#fff", borderRadius: 999, padding: "1px 8px", fontSize: "0.78rem" }}>
                    {money(customer.rewardsBalance)}
                </span>
            )}
        </a>
    );
}
