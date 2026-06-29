"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

export default function QuotePage() {
    const { token } = useParams();
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState("");
    const [paying, setPaying]   = useState(false);
    const [paid, setPaid]       = useState(null);

    const load = useCallback(async () => {
        try {
            const r = await fetch(`/api/quote/${token}`);
            const d = await r.json();
            if (d.error) setErr(d.error); else setData(d);
        } catch { setErr("Could not load this quote."); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => {
        const sid = new URLSearchParams(window.location.search).get("session_id");
        if (sid) {
            fetch(`/api/quote/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", sessionId: sid }) })
                .then((r) => r.json()).then((d) => { setPaid(d); setLoading(false); })
                .catch(() => { setErr("Could not confirm your payment. If you were charged, it will still be recorded."); setLoading(false); });
        } else {
            load();
        }
    }, [token, load]);

    const approve = async () => {
        setPaying(true); setErr("");
        try {
            const r = await fetch(`/api/quote/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkout" }) });
            const d = await r.json();
            if (d.error) { setErr(d.error); setPaying(false); return; }
            window.location.href = d.url;
        } catch { setErr("Could not start checkout."); setPaying(false); }
    };

    const wrap = { minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial, sans-serif", padding: "24px 16px" };
    const card = { maxWidth: 560, margin: "0 auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" };
    const head = (brand) => (
        <div style={{ background: "#111827", padding: "20px 32px" }}><span style={{ color: "#D3A73D", fontSize: 18, fontWeight: 700 }}>{brand || "Premier Printing"}</span></div>
    );

    if (loading) return <div style={wrap}><div style={card}>{head()}<p style={{ color: "#6b7280", padding: "40px 32px", textAlign: "center", margin: 0 }}>Loading…</p></div></div>;

    if (paid) return (
        <div style={wrap}><div style={{ ...card, textAlign: "center" }}>
            {head(paid.brandName)}
            <div style={{ padding: "40px 32px" }}>
                {paid.paid ? (<>
                    <div style={{ fontSize: 48 }}>✅</div>
                    <h1 style={{ color: "#111827", fontSize: 22, margin: "12px 0 8px" }}>Payment received</h1>
                    <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>Thank you! Your order {paid.poNumber ? `#${paid.poNumber}` : ""} is paid and now in production.</p>
                </>) : (<>
                    <h1 style={{ color: "#111827", fontSize: 20, margin: "0 0 8px" }}>Payment pending</h1>
                    <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>If you just paid, refresh this page in a moment.</p>
                </>)}
            </div>
        </div></div>
    );

    const q = data?.quote;
    if (err && !q) return <div style={wrap}><div style={{ ...card, textAlign: "center" }}>{head(data?.brandName)}<div style={{ padding: "40px 32px" }}><h1 style={{ color: "#111827", fontSize: 20, margin: "0 0 8px" }}>Hmm…</h1><p style={{ color: "#6b7280", margin: 0 }}>{err}</p></div></div></div>;
    if (!q) return null;

    const due = (q.total || 0) - (q.discountAmount || 0);
    const converted = q.status === "converted";

    return (
        <div style={wrap}><div style={card}>
            {head(data.brandName)}
            <div style={{ padding: "28px 32px" }}>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>Quote {q.quoteId}</div>
                <h1 style={{ color: "#111827", fontSize: 22, margin: "4px 0 16px" }}>{converted ? "This quote is paid" : "Your quote"}</h1>
                {q.message && <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, color: "#374151", fontSize: 14, marginBottom: 20 }}>{q.message}</div>}

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                    {(q.lines || []).map((l, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i ? "1px solid #f1f5f9" : "none" }}>
                            {l.image && <img src={l.image} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 6, background: "#f3f4f6", flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>{l.title || l.sku || "Item"}</div>
                                <div style={{ color: "#6b7280", fontSize: 12 }}>Qty {l.quantity || 1}{l.unitPrice ? ` · ${money(l.unitPrice)} ea` : ""}{l.setupFee ? ` · ${money(l.setupFee)} setup` : ""}</div>
                            </div>
                            <div style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>{money((Number(l.unitPrice) || 0) * (Number(l.quantity) || 1) + (Number(l.setupFee) || 0))}</div>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: 14 }}>
                    {q.discountAmount > 0 && <Row label={`Discount${q.discountName ? ` (${q.discountName})` : ""}`} value={`−${money(q.discountAmount)}`} color="#dc2626" />}
                    {q.shippingCost > 0 && <Row label="Shipping" value={money(q.shippingCost)} />}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 8, borderTop: "1px solid #e5e7eb" }}>
                        <span style={{ fontWeight: 700, color: "#111827" }}>Total Due</span>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: 18 }}>{money(due)}</span>
                    </div>
                </div>

                {err && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 14 }}>{err}</p>}

                {!converted && (
                    <button onClick={approve} disabled={paying}
                        style={{ width: "100%", marginTop: 20, background: "#D3A73D", color: "#111827", border: "none", borderRadius: 8, padding: 15, fontWeight: 700, fontSize: 16, cursor: paying ? "default" : "pointer" }}>
                        {paying ? "Starting…" : `Approve & Pay ${money(due)}`}
                    </button>
                )}
                <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12, textAlign: "center" }}>Secure payment powered by Stripe</p>
            </div>
        </div></div>
    );
}

function Row({ label, value, color }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: color || "#6b7280" }}>
            <span>{label}</span><span>{value}</span>
        </div>
    );
}
