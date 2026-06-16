"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "7px 12px", borderRadius: 8, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const input = { width: 64, padding: "5px 7px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.82rem" };
const RISK = { critical: { bg: "#fee2e2", fg: "#991b1b", label: "Critical" }, warning: { bg: "#fef9c3", fg: "#854d0e", label: "Low" }, ok: { bg: "#dcfce7", fg: "#166534", label: "OK" } };
const TASK_NEXT = { open: "ordered", ordered: "received" };

export default function DemandClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [poMsg, setPoMsg] = useState({});   // vendor → "creating"|"done:msg"|"error:msg"

    const load = async () => {
        try { const d = await (await fetch("/api/storefront/demand")).json(); if (!d.error) setData(d); }
        catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const post = async (body) => {
        const d = await (await fetch("/api/storefront/demand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
        if (d.error) throw new Error(d.error); return d;
    };
    const saveInv = async (productId, patch) => {
        setSaving((s) => ({ ...s, [productId]: true }));
        try { await post({ op: "inventory", productId, patch }); await load(); }
        catch { /* ignore */ } finally { setSaving((s) => ({ ...s, [productId]: false })); }
    };
    const reorder = async (p) => {
        setSaving((s) => ({ ...s, [p.productId]: true }));
        try { await post({ op: "reorder", productId: p.productId, qty: p.recommendedQty || Math.max(1, p.projected), title: p.title, supplierEmail: p.supplierEmail }); await load(); }
        catch { /* ignore */ } finally { setSaving((s) => ({ ...s, [p.productId]: false })); }
    };
    const setTask = async (id, status) => { try { await post({ op: "task", id, status }); await load(); } catch { /* ignore */ } };
    const createPO = async (vendor) => {
        const lines = (data?.blankReconcile?.rows || []).filter((r) => (r.vendor || "Unassigned") === vendor && r.inventoryId);
        setPoMsg((m) => ({ ...m, [vendor]: "creating" }));
        try { const d = await post({ op: "blank-po", vendor, lines }); setPoMsg((m) => ({ ...m, [vendor]: `done:${d.message}` })); await load(); }
        catch (e) { setPoMsg((m) => ({ ...m, [vendor]: `error:${e.message}` })); }
    };

    if (loading) return <div style={{ padding: 28 }}>Loading demand forecast…</div>;
    const f = data?.forecast || { products: [] };
    const tasks = data?.tasks || [];
    const blanks = data?.blanks || { byStyle: [], totalProjected: 0 };
    const reconcile = data?.blankReconcile;   // present only in the fulfiller (Premier) app

    return (
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Demand forecast 📈</h1>
            <p style={{ color: "#64748b", margin: "2px 0 0" }}>AI projects each product's sales — plan marketing, capacity, and what's trending. Made-to-order? You don't hold stock, so just use the demand numbers. Hold your own inventory for some products? Turn on stock tracking below.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 18 }}>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>AI projected units · 30d</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{f.aiNext30 ?? "—"}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>AI projected units · 90d</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{f.aiNext90 ?? "—"}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Trending up (30d)</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a" }}>{f.products.filter((p) => p.trendPct > 0).length}</div></div>
                {(f.atRisk > 0 || tasks.length > 0)
                    ? <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Tracked · stockout risk</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: f.atRisk ? "#dc2626" : "#16a34a" }}>{f.atRisk || 0}</div></div>
                    : <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Products tracked</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{f.products.filter((p) => p.tracked).length}</div></div>}
            </div>

            {blanks.byStyle.length > 0 && (
                <div style={{ ...card, marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                        <b>Projected blank needs · next {blanks.horizonDays || 30}d</b>
                        <span style={{ color: "#64748b", fontSize: "0.82rem" }}>~{blanks.totalProjected} pieces total — what your fulfiller needs to stock</span>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.76rem", margin: "4px 0 12px" }}>For made-to-order products, the inventory that matters is the blank (style · color · size) at your fulfiller — not finished goods. This rolls your store's sales up to that level.</p>
                    <div style={{ display: "grid", gap: 10 }}>
                        {blanks.byStyle.slice(0, 8).map((s) => (
                            <div key={s.style} style={{ border: "1px solid #f1f5f9", borderRadius: 9, padding: "10px 12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <b style={{ fontSize: "0.9rem" }}>{s.style}</b>
                                    <span style={{ background: "#eef2ff", color: "#3730a3", fontSize: "0.74rem", fontWeight: 700, padding: "2px 9px", borderRadius: 999 }}>~{s.projected} pcs</span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                    {s.variants.slice(0, 14).map((v, i) => (
                                        <span key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 7px", fontSize: "0.74rem", color: "#475569" }}>
                                            {v.color} · {v.size} <b style={{ color: "#0f172a" }}>{v.projected}</b>
                                        </span>
                                    ))}
                                    {s.variants.length > 14 && <span style={{ color: "#94a3b8", fontSize: "0.74rem" }}>+{s.variants.length - 14} more</span>}
                                </div>
                            </div>
                        ))}
                        {blanks.byStyle.length > 8 && <div style={{ color: "#94a3b8", fontSize: "0.76rem" }}>+{blanks.byStyle.length - 8} more styles</div>}
                    </div>
                </div>
            )}

            {reconcile?.byVendor?.length > 0 && (
                <div style={{ ...card, marginTop: 16, background: "#fafbff", border: "1px solid #c7d2fe" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                        <b>Blank reorder plan</b>
                        <span style={{ color: "#64748b", fontSize: "0.82rem" }}>{reconcile.totalSuggested} units short of projected demand · ~${reconcile.totalOrderValue}</span>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.76rem", margin: "4px 0 12px" }}>Projected blank demand minus your on-hand + on-order inventory. Create a draft PO and we'll bump Premier's inventory <i>pending</i> so the blank forecast stops re-suggesting it.</p>
                    <div style={{ display: "grid", gap: 8 }}>
                        {reconcile.byVendor.map((v) => {
                            const st = poMsg[v.vendor] || "";
                            return (
                                <div key={v.vendor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid #eef2ff", paddingBottom: 8 }}>
                                    <div><b>{v.vendor}</b> <span style={{ color: "#64748b", fontSize: "0.82rem" }}>· {v.units} units · {v.lines} lines · ~${v.value}</span>
                                        {st.startsWith("done") && <div style={{ color: "#16a34a", fontSize: "0.8rem", marginTop: 3 }}>✓ {st.slice(5)}</div>}
                                        {st.startsWith("error") && <div style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 3 }}>{st.slice(6)}</div>}
                                    </div>
                                    {!st.startsWith("done") && <button onClick={() => createPO(v.vendor)} disabled={st === "creating"} style={btn}>{st === "creating" ? "Creating…" : "Create draft PO"}</button>}
                                </div>
                            );
                        })}
                    </div>
                    {reconcile.tracked < reconcile.rows.length && <p style={{ color: "#94a3b8", fontSize: "0.74rem", marginTop: 8 }}>{reconcile.rows.length - reconcile.tracked} projected line(s) have no inventory record yet — add them in blank inventory to include in a PO.</p>}
                </div>
            )}

            {tasks.length > 0 && (
                <div style={{ ...card, marginTop: 16 }}>
                    <b>Reorders to action</b>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                        {tasks.map((t) => (
                            <div key={t._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                                <div><b>{t.qty}</b> × {t.title || "product"} <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>· {t.source}{t.status !== "open" ? ` · ${t.status}` : ""}</span></div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    {TASK_NEXT[t.status] && <button onClick={() => setTask(t._id, TASK_NEXT[t.status])} style={btn}>Mark {TASK_NEXT[t.status]}</button>}
                                    {t.status !== "cancelled" && t.status !== "received" && <button onClick={() => setTask(t._id, "cancelled")} style={ghost}>Cancel</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ ...card, marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: 820 }}>
                    <thead><tr style={{ textAlign: "left", color: "#64748b" }}>
                        <th style={{ padding: "6px 8px" }}>Product</th><th>Sold 90d</th><th>Avg/day</th><th>Trend</th><th>Proj 30d</th><th>In stock</th><th>Days left</th><th>Risk</th><th>Auto</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                        {f.products.map((p) => {
                            const r = RISK[p.risk] || RISK.ok; const busy = saving[p.productId];
                            return (
                                <tr key={p.productId} style={{ borderTop: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "8px", fontWeight: 600 }}>{p.title}{p.sku ? <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {p.sku}</span> : null}</td>
                                    <td>{p.soldUnits}</td>
                                    <td>{p.avgDaily}</td>
                                    <td style={{ color: p.trendPct > 0 ? "#16a34a" : p.trendPct < 0 ? "#dc2626" : "#94a3b8" }}>{p.trendPct > 0 ? "+" : ""}{p.trendPct}%</td>
                                    <td style={{ fontWeight: 700 }}>{p.projected}</td>
                                    <td><input type="number" defaultValue={p.onHand ?? ""} placeholder="—" style={input} onBlur={(e) => { const v = e.target.value; if (v !== "" && Number(v) !== p.onHand) saveInv(p.productId, { onHand: Number(v) }); }} /></td>
                                    <td>{p.daysToStockout == null ? "—" : `${p.daysToStockout}d`}</td>
                                    <td><span style={{ background: r.bg, color: r.fg, fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{r.label}</span></td>
                                    <td><input type="checkbox" checked={!!p.autoReorder} onChange={(e) => saveInv(p.productId, { autoReorder: e.target.checked })} /></td>
                                    <td>{p.recommendedQty > 0
                                        ? <button onClick={() => reorder(p)} disabled={busy} style={btn}>Reorder {p.recommendedQty}</button>
                                        : <button onClick={() => reorder(p)} disabled={busy} style={ghost}>Reorder</button>}</td>
                                </tr>
                            );
                        })}
                        {f.products.length === 0 && <tr><td colSpan={10} style={{ padding: 16, color: "#64748b" }}>No sales data yet — demand forecasts appear as orders come in.</td></tr>}
                    </tbody>
                </table>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.76rem", marginTop: 10 }}><b>Made-to-order / print-on-demand:</b> leave <b>In stock</b> blank — your fulfiller stocks the blanks, so there's nothing to reorder. <b>Warehousing it yourself?</b> Set <b>In stock</b> + a supplier and flip <b>Auto</b> on, and autopilot will open reorders (and email your supplier) before you run out. {f.computedAt ? `AI curve updated ${new Date(f.computedAt).toLocaleDateString()}.` : ""}</p>
        </div>
    );
}
