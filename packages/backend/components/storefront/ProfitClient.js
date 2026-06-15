"use client";
import { useCallback, useEffect, useState } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const RANGES = [["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"]];

export default function ProfitClient() {
    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try { const d = await (await fetch(`/api/storefront/profit?range=${range}`)).json(); setData(d.error ? null : d); }
        finally { setLoading(false); }
    }, [range]);
    useEffect(() => { load(); }, [load]);

    const t = data?.totals;
    const maxProfit = Math.max(1, ...((data?.trend || []).map((d) => Math.abs(d.profitCents))));

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Profit</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>Real net profit after product cost, payment fees, discounts &amp; refunds — not just revenue.</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {RANGES.map(([k, l]) => <button key={k} onClick={() => setRange(k)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: range === k ? "#111" : "#fff", color: range === k ? "#fff" : "#334155" }}>{l}</button>)}
                </div>
            </div>

            {loading && !data ? <div style={{ color: "#64748b", padding: 30 }}>Loading…</div> : !t ? <div style={{ color: "#dc2626", padding: 30 }}>No data yet.</div> : (
                <>
                    {/* Headline */}
                    <div style={{ ...card, marginTop: 18, background: t.profitCents >= 0 ? "linear-gradient(120deg,#16a34a,#22c55e)" : "linear-gradient(120deg,#dc2626,#ef4444)", color: "#fff", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Net profit</div>
                            <div style={{ fontSize: "2.4rem", fontWeight: 800 }}>{money(t.profitCents)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{t.marginPct}%</div>
                            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>margin · {money(t.profitPerOrderCents)}/order</div>
                        </div>
                    </div>

                    {/* P&L waterfall */}
                    <div style={{ ...card, marginTop: 14 }}>
                        <h2 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Profit &amp; loss</h2>
                        <PL label="Revenue (net of discounts)" value={t.revenueCents} positive />
                        <PL label="Product cost (COGS)" value={-t.cogsCents} />
                        <PL label="Payment + platform fees" value={-t.feesCents} />
                        <PL label="Refunds" value={-t.refundsCents} />
                        <div style={{ borderTop: "2px solid #e2e8f0", marginTop: 8, paddingTop: 8 }}>
                            <PL label="Net profit" value={t.profitCents} bold />
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12, marginTop: 14 }}>
                        <Stat label="Orders" value={t.orders.toLocaleString()} />
                        <Stat label="Avg order value" value={money(t.aovCents)} />
                        <Stat label="Profit / order" value={money(t.profitPerOrderCents)} />
                        <Stat label="Discounts given" value={money(t.discountsCents)} />
                    </div>

                    {/* Trend */}
                    {data.trend?.length > 1 && (
                        <div style={{ ...card, marginTop: 14 }}>
                            <h2 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Daily profit</h2>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
                                {data.trend.map((d) => (
                                    <div key={d.date} title={`${d.date}: ${money(d.profitCents)}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                                        <div style={{ height: `${(Math.abs(d.profitCents) / maxProfit) * 100}%`, background: d.profitCents >= 0 ? "#16a34a" : "#dc2626", borderRadius: 2, minHeight: 2 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 10 }}>Covers storefront orders. Provider shipping/handling are billed separately and not deducted here.</p>
                </>
            )}
        </div>
    );
}

function PL({ label, value, positive, bold }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.92rem", fontWeight: bold ? 800 : 400 }}>
            <span>{label}</span>
            <span style={{ color: value < 0 ? "#dc2626" : positive || bold ? "#16a34a" : "#111" }}>{value < 0 ? `−$${(Math.abs(value) / 100).toFixed(2)}` : `$${(value / 100).toFixed(2)}`}</span>
        </div>
    );
}
function Stat({ label, value }) {
    return <div style={card}><div style={{ fontSize: "0.78rem", color: "#64748b" }}>{label}</div><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{value}</div></div>;
}
