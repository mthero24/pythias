"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const input = { padding: "7px 9px", border: "1px solid #cbd5e1", borderRadius: 7, fontSize: "0.86rem", width: 110 };
const kycInput = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };
const REGIONS = ["", "northeast", "southeast", "midwest", "west", "southwest"];

function Toggle({ on, onChange, label, hint }) {
    return (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <span onClick={() => onChange(!on)} style={{ flex: "0 0 auto", width: 38, height: 22, borderRadius: 999, background: on ? "#635bff" : "#cbd5e1", position: "relative", marginTop: 2 }}>
                <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
            </span>
            <span><b style={{ fontSize: "0.9rem" }}>{label}</b>{hint && <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{hint}</div>}</span>
        </label>
    );
}

export default function SupplierClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try { const d = await (await fetch("/api/storefront/supplier")).json(); if (!d.error) setData(d); }
        catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const enroll = async () => {
        setBusy(true);
        try { await fetch("/api/storefront/supplier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "enroll" }) }); await load(); }
        finally { setBusy(false); }
    };
    const save = async (patch) => {
        try { const d = await (await fetch("/api/storefront/supplier", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })).json(); if (!d.error) setData((p) => ({ ...p, status: d.status })); }
        catch { /* ignore */ }
    };
    const [kyc, setKyc] = useState({ legalName: "", taxId: "", businessType: "", address: "", contactEmail: "" });
    const [kycMsg, setKycMsg] = useState("");
    const submitKyc = async (e) => {
        e.preventDefault();
        if (!kyc.legalName.trim() || !kyc.taxId.trim()) { setKycMsg("Legal name and tax ID are required."); return; }
        setBusy(true); setKycMsg("");
        try { const d = await (await fetch("/api/storefront/supplier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "submit-kyc", kyc }) })).json();
            if (d.error) throw new Error(d.error); setData((p) => ({ ...p, status: d.status })); }
        catch (e) { setKycMsg(e.message); } finally { setBusy(false); }
    };

    if (loading) return <div style={{ padding: 28 }}>Loading…</div>;
    const status = data?.status || {};
    const cap = status.capacity || {};
    const loc = status.location || {};
    const orders = data?.orders || { recent: [] };

    if (!status.enrolled) {
        return (
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>
                <h1 style={{ margin: 0 }}>Earn as a fulfiller 🤝</h1>
                <p style={{ color: "#64748b", margin: "6px 0 0" }}>You sell on Pythias — now earn on the other side. Put your spare production capacity to work fulfilling <b>other sellers'</b> orders that route to you, and get paid per order. The same network that fulfills your sales can pay you to fulfill theirs.</p>
                <div style={{ ...card, marginTop: 18 }}>
                    <ul style={{ margin: "0 0 14px", paddingLeft: 18, color: "#475569", fontSize: "0.92rem", lineHeight: 1.7 }}>
                        <li>The routing engine sends you overflow orders that match your capacity & location.</li>
                        <li>You set your daily cap, handling fee, and can pause intake anytime.</li>
                        <li>Earnings (wholesale + handling) accrue per fulfilled order and pay out automatically.</li>
                    </ul>
                    <button onClick={enroll} disabled={busy} style={btn}>{busy ? "Enrolling…" : "Become a network fulfiller"}</button>
                </div>
            </div>
        );
    }

    // KYC gate — enrolled but not yet verified: can't take orders until Pythias verifies.
    if (status.kycStatus !== "verified") {
        const submitted = status.kycStatus === "submitted";
        const rejected = status.kycStatus === "rejected";
        return (
            <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px" }}>
                <h1 style={{ margin: 0 }}>Verify your business 🪪</h1>
                <p style={{ color: "#64748b", margin: "6px 0 0" }}>Before orders can route to you as a fulfiller, we verify your business (KYC). This protects buyers and the network. Orders won't route to you until you're verified.</p>
                {submitted ? (
                    <div style={{ ...card, marginTop: 18, background: "#fef9c3", border: "1px solid #fde68a" }}>
                        <b style={{ color: "#854d0e" }}>Under review ⏳</b>
                        <p style={{ color: "#713f12", fontSize: "0.9rem", margin: "6px 0 0" }}>We've received your details{status.kyc?.submittedAt ? ` (${new Date(status.kyc.submittedAt).toLocaleDateString()})` : ""}. Verification is usually quick — you'll go live automatically once approved.</p>
                    </div>
                ) : (
                    <form onSubmit={submitKyc} style={{ ...card, marginTop: 18, display: "grid", gap: 10 }}>
                        {rejected && status.kyc?.reason && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: 10, fontSize: "0.86rem" }}>Previous submission was declined: {status.kyc.reason}. Please correct and resubmit.</div>}
                        <input value={kyc.legalName} onChange={(e) => setKyc({ ...kyc, legalName: e.target.value })} placeholder="Legal business name *" style={kycInput} />
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <input value={kyc.taxId} onChange={(e) => setKyc({ ...kyc, taxId: e.target.value })} placeholder="Tax ID / EIN *" style={{ ...kycInput, flex: 1, minWidth: 160 }} />
                            <input value={kyc.businessType} onChange={(e) => setKyc({ ...kyc, businessType: e.target.value })} placeholder="Business type (LLC, etc.)" style={{ ...kycInput, flex: 1, minWidth: 160 }} />
                        </div>
                        <input value={kyc.address} onChange={(e) => setKyc({ ...kyc, address: e.target.value })} placeholder="Business address" style={kycInput} />
                        <input value={kyc.contactEmail} onChange={(e) => setKyc({ ...kyc, contactEmail: e.target.value })} placeholder="Contact email" style={kycInput} />
                        <div><button type="submit" disabled={busy} style={btn}>{busy ? "Submitting…" : "Submit for verification"}</button></div>
                        {kycMsg && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{kycMsg}</div>}
                        <div style={{ color: "#94a3b8", fontSize: "0.74rem" }}>Your tax details are used only for verification and 1099 reporting.</div>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Fulfiller dashboard 🤝</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>You're a fulfiller on the Pythias network{cap.warmupMode ? " · warming up (capacity ramps as you build a track record)" : ""}.</p>
                </div>
                <span style={{ background: cap.isPaused ? "#fee2e2" : "#dcfce7", color: cap.isPaused ? "#991b1b" : "#166534", fontWeight: 700, fontSize: "0.78rem", padding: "5px 12px", borderRadius: 999 }}>{cap.isPaused ? "Paused" : "Accepting orders"}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 18 }}>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Earned (all time)</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16a34a" }}>{money(orders.totalEarnedCents)}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Orders fulfilled</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{orders.ordersFulfilled || 0}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Today</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{cap.currentDailyCount || 0}<span style={{ color: "#94a3b8", fontSize: "0.9rem" }}> / {cap.maxDailyOrders}</span></div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Fulfillable SKUs</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{status.catalogCount || 0}</div></div>
            </div>

            <div style={{ ...card, marginTop: 16, display: "grid", gap: 14 }}>
                <b>Intake controls</b>
                <Toggle on={!cap.isPaused} onChange={(v) => save({ isPaused: !v })} label="Accepting orders" hint="Pause to stop new orders routing to you (in-flight orders are unaffected)." />
                <Toggle on={cap.allowOverflowIn} onChange={(v) => save({ allowOverflowIn: v })} label="Accept overflow from other fulfillers" hint="Take orders other providers can't absorb at peak." />
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ fontSize: "0.86rem" }}>Max orders / day <input type="number" defaultValue={cap.maxDailyOrders} style={input} onBlur={(e) => Number(e.target.value) !== cap.maxDailyOrders && save({ maxDailyOrders: Number(e.target.value) })} /></label>
                    <label style={{ fontSize: "0.86rem" }}>Handling fee (¢) <input type="number" defaultValue={cap.handlingFee} style={input} onBlur={(e) => Number(e.target.value) !== cap.handlingFee && save({ handlingFee: Number(e.target.value) })} /></label>
                </div>
                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 8 }}>Ship-from location <span style={{ color: "#94a3b8", fontWeight: 400 }}>(drives geo routing)</span></div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <label style={{ fontSize: "0.84rem" }}>State <input defaultValue={loc.state || ""} style={{ ...input, width: 64 }} onBlur={(e) => e.target.value !== (loc.state || "") && save({ state: e.target.value.toUpperCase() })} /></label>
                        <label style={{ fontSize: "0.84rem" }}>ZIP <input defaultValue={loc.zip || ""} style={{ ...input, width: 90 }} onBlur={(e) => e.target.value !== (loc.zip || "") && save({ zip: e.target.value })} /></label>
                        <label style={{ fontSize: "0.84rem" }}>Region <select defaultValue={loc.region || ""} style={{ ...input, width: 130 }} onChange={(e) => save({ region: e.target.value || undefined })}>{REGIONS.map((r) => <option key={r} value={r}>{r || "—"}</option>)}</select></label>
                    </div>
                </div>
                {status.catalogCount === 0 && <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: 10, color: "#9a3412", fontSize: "0.82rem" }}>You have no fulfillable SKUs registered yet, so no orders will route to you. Add your blank/color/size offerings in Fulfillment → Provider Catalog to start receiving orders.</div>}
            </div>

            <div style={{ ...card, marginTop: 16, overflowX: "auto" }}>
                <b>Orders routed to you</b>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", marginTop: 10, minWidth: 480 }}>
                    <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th style={{ padding: "5px 8px" }}>Order</th><th>Handoff</th><th>Order status</th><th style={{ textAlign: "right" }}>You earn</th></tr></thead>
                    <tbody>
                        {orders.recent.map((o, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "7px 8px", fontFamily: "monospace" }}>{o.poNumber}</td>
                                <td>{o.handoffStatus || "—"}</td>
                                <td>{o.orderStatus}</td>
                                <td style={{ textAlign: "right", fontWeight: 600 }}>{money(o.earnedCents)}</td>
                            </tr>
                        ))}
                        {orders.recent.length === 0 && <tr><td colSpan={4} style={{ padding: 14, color: "#64748b" }}>No orders routed to you yet — they'll appear here as the network sends them.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
