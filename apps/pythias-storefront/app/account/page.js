"use client";
import { useEffect, useState } from "react";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, money, fmtDate, card, StatusBadge } from "@/components/account/ui";

export default function AccountPage() {
    return <AccountShell active="/account"><Overview /></AccountShell>;
}

function Overview() {
    const { customer } = useCustomer();
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        fetch("/api/account/orders", { headers: authHeaders() })
            .then((r) => r.json()).then((d) => setOrders(d.error ? [] : d.orders)).catch(() => setOrders([]));
    }, []);

    return (
        <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ ...card, background: "var(--sf-secondary, #16a34a)", color: "#fff", border: "none" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Rewards balance</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>{money(customer.rewardsBalance)}</div>
                    <div style={{ fontSize: "0.82rem", opacity: 0.9 }}>Apply at checkout</div>
                </div>
                <div style={card}>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Signed in as</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{customer.name || customer.email}</div>
                    {customer.phone && <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{customer.phone}</div>}
                    <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#64748b" }}>
                        Marketing: {[customer.marketingConsent?.email && "email", customer.marketingConsent?.sms && "text"].filter(Boolean).join(", ") || "not subscribed"}
                    </div>
                </div>
            </div>

            <a href="/favorites" style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "#111" }}>
                <span style={{ fontWeight: 600 }}>♥ My favorites</span>
                <span style={{ color: "var(--sf-accent, #f59e0b)", fontWeight: 600, fontSize: "0.88rem" }}>View →</span>
            </a>

            <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent orders</h2>
                    <a href="/account/orders" style={{ color: "var(--sf-accent, #f59e0b)", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>View all →</a>
                </div>
                {orders === null ? <div style={{ color: "#64748b" }}>Loading…</div>
                    : orders.length === 0 ? <div style={{ color: "#64748b" }}>No orders yet. <a href="/products" style={{ color: "var(--sf-accent, #f59e0b)" }}>Start shopping →</a></div>
                    : orders.slice(0, 4).map((o) => (
                        <a key={o.id} href={`/account/orders/${o.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(0,0,0,0.06)", textDecoration: "none", color: "#111" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>#{o.poNumber || o.id.slice(-6)}</div>
                                <div style={{ color: "#64748b", fontSize: "0.84rem" }}>{fmtDate(o.date)}</div>
                            </div>
                            <StatusBadge status={o.status} />
                        </a>
                    ))}
            </div>
        </div>
    );
}
