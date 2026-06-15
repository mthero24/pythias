"use client";
import { useEffect, useState } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, fmtDate, card } from "@/components/account/ui";

const STATUS = {
    requested: { bg: "#f1f5f9", fg: "#475569" }, approved: { bg: "#dbeafe", fg: "#1e40af" },
    received: { bg: "#fef9c3", fg: "#854d0e" }, refunded: { bg: "#dcfce7", fg: "#166534" },
    credited: { bg: "#dcfce7", fg: "#166534" }, exchanged: { bg: "#dcfce7", fg: "#166534" },
    rejected: { bg: "#fee2e2", fg: "#991b1b" }, completed: { bg: "#dcfce7", fg: "#166534" },
};

export default function ReturnsPage() {
    return <AccountShell active="/account/returns"><ReturnsList /></AccountShell>;
}

function ReturnsList() {
    const [returns, setReturns] = useState(null);
    useEffect(() => {
        fetch("/api/account/returns", { headers: authHeaders() }).then((r) => r.json()).then((d) => setReturns(d.error ? [] : d.returns)).catch(() => setReturns([]));
    }, []);

    if (returns === null) return <div style={{ color: "#64748b" }}>Loading…</div>;
    if (returns.length === 0) return <div style={card}>No returns yet. Start one from an order in <a href="/account/orders" style={{ color: "var(--sf-accent,#f59e0b)" }}>your orders</a>.</div>;

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {returns.map((r) => {
                const c = STATUS[r.status] || STATUS.requested;
                return (
                    <div key={r.id} style={card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>{r.rmaNumber} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· order #{r.poNumber} · {r.resolution.replace("_", " ")}</span></div>
                                <div style={{ color: "#64748b", fontSize: "0.82rem" }}>{fmtDate(r.createdAt)} · {r.items.length} item(s)</div>
                            </div>
                            <span style={{ background: c.bg, color: c.fg, fontWeight: 600, fontSize: "0.78rem", padding: "3px 10px", borderRadius: 999, textTransform: "capitalize" }}>{r.status}</span>
                        </div>
                        {r.sellerNote && <div style={{ marginTop: 8, fontSize: "0.86rem", color: "#475569", background: "#f8fafc", borderRadius: 8, padding: 8 }}>{r.sellerNote}</div>}
                    </div>
                );
            })}
        </div>
    );
}
