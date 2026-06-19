"use client";
import { useEffect, useState } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, fmtDate, card, StatusBadge } from "@/components/account/ui";

export default function OrdersPage() {
    return <AccountShell active="/account/orders"><OrdersList /></AccountShell>;
}

function OrdersList() {
    const [orders, setOrders] = useState(null);
    useEffect(() => {
        fetch("/api/account/orders", { headers: authHeaders() })
            .then((r) => r.json()).then((d) => setOrders(d.error ? [] : d.orders)).catch(() => setOrders([]));
    }, []);

    if (orders === null) return <div style={{ color: "#64748b" }}>Loading…</div>;
    if (orders.length === 0) return <div style={card}>No orders yet. <a href="/products" style={{ color: "var(--sf-accent, #f59e0b)" }}>Start shopping →</a></div>;

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {orders.map((o) => (
                <a key={o.id} href={`/account/orders/${o.id}`} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "#111" }}>
                    <div>
                        <div style={{ fontWeight: 700 }}>#{o.poNumber || o.id.slice(-6)}</div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{fmtDate(o.date)}</div>
                        {o.hasGift && <div style={{ color: "#9333ea", fontSize: "0.82rem", marginTop: 2 }}>🎁 Gift options added</div>}
                        {o.tracking && <div style={{ color: "var(--sf-secondary, #16a34a)", fontSize: "0.82rem", marginTop: 2 }}>Tracking available</div>}
                    </div>
                    <StatusBadge status={o.status} />
                </a>
            ))}
        </div>
    );
}
