"use client";
import { useCallback, useEffect, useState } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const RANGES = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"]];

// Web Vitals thresholds (Google): [good, needs-improvement] upper bounds.
const VITALS = {
    lcp: { label: "LCP", unit: "ms", good: 2500, ni: 4000, help: "Largest Contentful Paint" },
    inp: { label: "INP", unit: "ms", good: 200, ni: 500, help: "Interaction to Next Paint" },
    cls: { label: "CLS", unit: "", good: 0.1, ni: 0.25, help: "Cumulative Layout Shift" },
    fcp: { label: "FCP", unit: "ms", good: 1800, ni: 3000, help: "First Contentful Paint" },
    ttfb: { label: "TTFB", unit: "ms", good: 800, ni: 1800, help: "Time To First Byte" },
};
const vitalColor = (k, v) => {
    if (v == null) return "#94a3b8";
    const t = VITALS[k];
    return v <= t.good ? "#16a34a" : v <= t.ni ? "#d97706" : "#dc2626";
};

export default function AnalyticsClient() {
    const [range, setRange] = useState("7d");
    const [data, setData] = useState(null);
    const [live, setLive] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try { const d = await (await fetch(`/api/analytics/summary?range=${range}`)).json(); setData(d.error ? null : d); }
        finally { setLoading(false); }
    }, [range]);
    useEffect(() => { load(); }, [load]);

    // Live visitors: poll every 10s.
    useEffect(() => {
        let alive = true;
        const tick = async () => { try { const d = await (await fetch("/api/analytics/live")).json(); if (alive && !d.error) setLive(d); } catch { /* ignore */ } };
        tick(); const id = setInterval(tick, 10000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    const [insights, setInsights] = useState(null);
    const [insightsBusy, setInsightsBusy] = useState(false);
    const loadInsights = async () => {
        setInsightsBusy(true);
        try { const d = await (await fetch(`/api/analytics/insights?range=${range}`)).json(); setInsights(d.error ? [] : (d.insights || [])); }
        finally { setInsightsBusy(false); }
    };
    const o = data?.overview;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Site analytics</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>Live traffic, conversions, behavior, and page speed for your storefront.</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {RANGES.map(([k, l]) => (
                        <button key={k} onClick={() => setRange(k)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: range === k ? "#111" : "#fff", color: range === k ? "#fff" : "#334155" }}>{l}</button>
                    ))}
                </div>
            </div>

            {/* Live now */}
            <div style={{ ...card, marginTop: 18, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: "#16a34a", boxShadow: "0 0 0 4px rgba(22,163,74,.2)" }} />
                    <span style={{ fontSize: "2rem", fontWeight: 800 }}>{live?.active ?? "—"}</span>
                    <span style={{ color: "#64748b" }}>visitors right now</span>
                </div>
                {live?.pages?.length > 0 && (
                    <div style={{ flex: 1, minWidth: 240, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {live.pages.slice(0, 5).map((p) => (
                            <span key={p.path} style={{ fontSize: "0.8rem", background: "#f1f5f9", borderRadius: 999, padding: "3px 10px" }}>{p.path} · {p.count}</span>
                        ))}
                    </div>
                )}
            </div>

            {loading && !data ? <div style={{ color: "#64748b", padding: 30 }}>Loading…</div> : !data ? <div style={{ color: "#dc2626", padding: 30 }}>No data yet.</div> : (
                <>
                    {/* Overview */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
                        <Stat label="Visitors" value={o.visitors.toLocaleString()} />
                        <Stat label="Sessions" value={o.sessions.toLocaleString()} />
                        <Stat label="Page views" value={o.pageviews.toLocaleString()} />
                        <Stat label="Conversion rate" value={`${o.conversionRate}%`} />
                        <Stat label="Revenue" value={money(o.revenueCents)} />
                        <Stat label="Avg. session" value={`${o.avgDurationSec}s`} />
                        <Stat label="Bounce rate" value={`${o.bounceRate}%`} />
                        <Stat label="Orders" value={o.conversions.toLocaleString()} />
                    </div>

                    {/* Funnel */}
                    <Section title="Conversion funnel">
                        <Funnel funnel={data.funnel} />
                    </Section>

                    {/* Acquisition + Behavior */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 }}>
                        <ListCard title="Top referrers" rows={data.referrers} />
                        <ListCard title="Devices" rows={data.devices} />
                        <ListCard title="Top pages" rows={data.topPages.map((p) => ({ label: p.path, count: p.views }))} />
                        <ListCard title="Top landing pages" rows={data.landingPages} />
                        <ListCard title="Top exit pages" rows={data.exitPages} hint="Where visitors leave — high exits on key pages signal friction." />
                    </div>

                    {/* AI insights */}
                    <Section title="✨ AI insights">
                        {!insights ? (
                            <button onClick={loadInsights} disabled={insightsBusy} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                                {insightsBusy ? "Analyzing…" : "Generate insights"}
                            </button>
                        ) : insights.length === 0 ? <div style={{ color: "#94a3b8" }}>Not enough data yet.</div> : insights.map((ins, i) => (
                            <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid #f1f5f9" : "none" }}>
                                <b>{ins.title}</b>
                                <div style={{ fontSize: "0.88rem", color: "#475569" }}>{ins.detail}</div>
                                {ins.action && <div style={{ fontSize: "0.84rem", color: "#16a34a", marginTop: 2 }}>→ {ins.action}</div>}
                            </div>
                        ))}
                    </Section>

                    {/* Attribution + audience */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 }}>
                        <RevCard title="Traffic sources (revenue)" rows={data.sources} />
                        <RevCard title="Campaigns (UTM)" rows={data.campaigns} emptyText="Tag links with ?utm_campaign=… to attribute revenue." />
                        <ListCard title="New vs returning" rows={[{ label: "New", count: data.newVsReturning?.new || 0 }, { label: "Returning", count: data.newVsReturning?.returning || 0 }]} />
                        <ListCard title="Top countries" rows={data.countries} hint="Needs Cloudflare/edge geo headers." />
                    </div>

                    {/* Product funnel */}
                    <Section title="Product performance — view → cart → buy">
                        {!data.products?.length ? <div style={{ color: "#94a3b8" }}>No product activity yet.</div> : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                                    <thead><tr style={{ textAlign: "left", color: "#64748b", fontSize: "0.78rem" }}><th style={{ padding: "4px 8px 4px 0" }}>Product</th><th>Views</th><th>Add to cart</th><th>Purchased</th><th>CVR</th></tr></thead>
                                    <tbody>{data.products.map((p) => (
                                        <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "7px 8px 7px 0", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</td>
                                            <td>{p.views.toLocaleString()}</td><td>{p.addToCart.toLocaleString()}</td><td>{p.purchasedUnits.toLocaleString()}</td>
                                            <td style={{ fontWeight: 700, color: p.cvr >= 2 ? "#16a34a" : "#475569" }}>{p.cvr}%</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </Section>

                    {/* Page speed */}
                    <Section title="Page speed (Core Web Vitals)">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                            {Object.entries(VITALS).map(([k, t]) => {
                                const v = data.vitals[k];
                                const display = v == null ? "—" : k === "cls" ? v : `${v}${t.unit}`;
                                return (
                                    <div key={k} style={{ ...card, textAlign: "center" }} title={t.help}>
                                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{t.label}</div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: vitalColor(k, v) }}>{display}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {data.slowestPages.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 6 }}>Slowest pages (by LCP)</div>
                                {data.slowestPages.map((p) => (
                                    <div key={p.path} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #f1f5f9", fontSize: "0.88rem" }}>
                                        <span>{p.path}</span>
                                        <span style={{ color: vitalColor("lcp", p.lcp), fontWeight: 600 }}>{p.lcp}ms <span style={{ color: "#94a3b8", fontWeight: 400 }}>({p.samples})</span></span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </>
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return <div style={card}><div style={{ fontSize: "0.78rem", color: "#64748b" }}>{label}</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div></div>;
}
// Acquisition card with revenue attribution (sessions · orders · revenue per source/campaign).
function RevCard({ title, rows, emptyText }) {
    return (
        <div style={card}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>{title}</h3>
            {!rows?.length ? <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{emptyText || "No data"}</div> : rows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderTop: i ? "1px solid #f6f6f6" : "none", fontSize: "0.84rem" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                    <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{r.sessions} · {r.conversions} ord · <b style={{ color: "#111" }}>{money(r.revenueCents)}</b></span>
                </div>
            ))}
        </div>
    );
}
function Section({ title, children }) {
    return <div style={{ ...card, marginTop: 14 }}><h2 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>{title}</h2>{children}</div>;
}
function ListCard({ title, rows, hint }) {
    const max = Math.max(1, ...(rows || []).map((r) => r.count));
    return (
        <div style={card}>
            <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem" }}>{title}</h3>
            {hint && <div style={{ fontSize: "0.76rem", color: "#94a3b8", marginBottom: 8 }}>{hint}</div>}
            {!rows?.length ? <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No data</div> : rows.map((r, i) => (
                <div key={i} style={{ margin: "6px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", marginBottom: 2 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{r.label}</span>
                        <b>{r.count.toLocaleString()}</b>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3 }}><div style={{ width: `${(r.count / max) * 100}%`, height: "100%", background: "#635bff", borderRadius: 3 }} /></div>
                </div>
            ))}
        </div>
    );
}
function Funnel({ funnel }) {
    const steps = [
        { label: "Visited", n: funnel.sessions },
        { label: "Added to cart", n: funnel.addedToCart },
        { label: "Started checkout", n: funnel.startedCheckout },
        { label: "Purchased", n: funnel.converted },
    ];
    const top = Math.max(1, funnel.sessions);
    return (
        <div style={{ display: "grid", gap: 10 }}>
            {steps.map((s, i) => {
                const pct = Math.round((s.n / top) * 100);
                const stepConv = i > 0 && steps[i - 1].n ? Math.round((s.n / steps[i - 1].n) * 100) : null;
                return (
                    <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", marginBottom: 3 }}>
                            <span>{s.label}{stepConv != null && <span style={{ color: "#94a3b8" }}> · {stepConv}% from prev</span>}</span>
                            <b>{s.n.toLocaleString()} ({pct}%)</b>
                        </div>
                        <div style={{ height: 22, background: "#f1f5f9", borderRadius: 6 }}><div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#635bff,#8b5cf6)", borderRadius: 6 }} /></div>
                    </div>
                );
            })}
        </div>
    );
}
