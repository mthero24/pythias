"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const RANGES = [["30d", "30 days"], ["90d", "90 days"], ["365d", "12 months"], ["ytd", "Year to date"]];
const DSTATE = { open: { bg: "#fef9c3", fg: "#854d0e" }, won: { bg: "#dcfce7", fg: "#166534" }, lost: { bg: "#fee2e2", fg: "#991b1b" } };

export default function MoRClient() {
    const [data, setData] = useState(null);
    const [range, setRange] = useState("90d");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/storefront/mor?range=${range}`).then((r) => r.json()).then((d) => { if (!d.error) setData(d); }).catch(() => {}).finally(() => setLoading(false));
    }, [range]);

    const tax = data?.tax || { byState: [] };
    const disputes = data?.disputes || { recent: [] };
    const sales = data?.sales || {};

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Merchant of Record ⚖️</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>Pythias is the merchant of record for your store. We collect &amp; remit sales tax and handle every chargeback — you never touch a tax form or dispute.</p>
                </div>
                <select value={range} onChange={(e) => setRange(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                    {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            {loading ? <div style={{ ...card, marginTop: 18, color: "#64748b" }}>Loading…</div> : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 18 }}>
                        <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Gross sales</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{money(sales.grossCents)}</div></div>
                        <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Tax collected &amp; remitted</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0891b2" }}>{money(tax.totalCents)}</div></div>
                        <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Jurisdictions filed</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{tax.jurisdictions || 0}</div></div>
                        <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Open disputes (we handle)</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: disputes.open ? "#b45309" : "#16a34a" }}>{disputes.open || 0}</div></div>
                    </div>

                    <div style={{ ...card, marginTop: 16, background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                        <b style={{ color: "#0f766e" }}>Tax remitted on your behalf</b>
                        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0 12px" }}>Pythias registers, collects, and files sales tax in every jurisdiction your orders ship to. You owe nothing and file nothing.</p>
                        {tax.byState.length === 0 ? <div style={{ color: "#64748b", fontSize: "0.88rem" }}>No taxable sales in this period.</div> : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                                <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th style={{ padding: "5px 8px" }}>State</th><th>Orders</th><th style={{ textAlign: "right" }}>Tax remitted</th></tr></thead>
                                <tbody>
                                    {tax.byState.map((s) => (
                                        <tr key={s.state} style={{ borderTop: "1px solid #cffafe" }}>
                                            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{s.state}</td>
                                            <td>{s.orders}</td>
                                            <td style={{ textAlign: "right" }}>{money(s.taxCents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div style={{ ...card, marginTop: 16 }}>
                        <b>Chargebacks &amp; disputes</b>
                        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0 12px" }}>We fight every chargeback as the merchant of record. {disputes.lostCents > 0 ? `${money(disputes.lostCents)} in lost disputes was absorbed against your payout per the MoR agreement.` : "Nothing for you to do."}</p>
                        {disputes.recent.length === 0 ? <div style={{ color: "#64748b", fontSize: "0.88rem" }}>No disputes — clean record. 🎉</div> : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                                <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th style={{ padding: "5px 8px" }}>Order</th><th>Amount</th><th>Reason</th><th>Status</th></tr></thead>
                                <tbody>
                                    {disputes.recent.map((d, i) => {
                                        const st = DSTATE[d.state] || DSTATE.open;
                                        return (
                                            <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{d.poNumber || "—"}</td>
                                                <td>{money(d.amountCents)}</td>
                                                <td>{(d.reason || "—").replace(/_/g, " ")}</td>
                                                <td><span style={{ background: st.bg, color: st.fg, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{d.state}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.76rem", marginTop: 10 }}>As your merchant of record, Pythias is the seller of record on the customer's statement, owns sales-tax nexus &amp; remittance, and assumes chargeback liability — the full compliance burden, off your plate.</p>
                </>
            )}
        </div>
    );
}
