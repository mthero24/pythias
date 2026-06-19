"use client";
import { use, useEffect, useState } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, money, fmtDate, card, ghostBtn, primaryBtn, inputSx, StatusBadge } from "@/components/account/ui";

export default function OrderDetailPage({ params }) {
    const { id } = use(params);
    return <AccountShell active="/account/orders"><OrderDetail id={id} /></AccountShell>;
}

const FULFILLMENT_LABEL = { pod: "Made to order", dropship: "Shipped by supplier", warehouse: "From our warehouse" };
const FULFILLMENT_STATUS = { routed: "In production", pending_supplier: "Preparing", pending_warehouse: "Picking", unroutable: "Processing" };

function OrderDetail({ id }) {
    const [order, setOrder] = useState(undefined);   // undefined=loading, null=not found

    useEffect(() => {
        fetch(`/api/account/orders/${id}`, { headers: authHeaders() })
            .then((r) => r.json()).then((d) => setOrder(d.error ? null : d.order)).catch(() => setOrder(null));
    }, [id]);

    if (order === undefined) return <div style={{ color: "#64748b" }}>Loading…</div>;
    if (order === null) return <div style={card}>Order not found. <a href="/account/orders" style={{ color: "var(--sf-accent, #f59e0b)" }}>← Back to orders</a></div>;

    const t = order.totals || {};
    return (
        <div style={{ display: "grid", gap: 16 }}>
            <a href="/account/orders" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.88rem" }}>← All orders</a>

            <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Order #{order.poNumber || order.id.slice(-6)}</h2>
                    <div style={{ color: "#64748b", fontSize: "0.88rem" }}>{fmtDate(order.date)}</div>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {order.fulfillment && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Shipments</h3>
                    <div style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: 8 }}>This order ships in {order.fulfillment.length} parts from different fulfillment centers — you may receive them separately.</div>
                    {order.fulfillment.map((g, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: i ? "1px solid rgba(0,0,0,0.06)" : "none", fontSize: "0.9rem" }}>
                            <span>{FULFILLMENT_LABEL[g.vertical] || "Fulfillment"} · {g.itemCount} item{g.itemCount === 1 ? "" : "s"}</span>
                            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{FULFILLMENT_STATUS[g.status] || g.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {order.tracking?.length > 0 && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Tracking</h3>
                    {order.tracking.map((tr, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                            <span style={{ fontSize: "0.9rem" }}>{tr.carrier || "Carrier"}: <b>{tr.trackingNumber}</b></span>
                            {tr.url && <a href={tr.url} target="_blank" rel="noreferrer" style={ghostBtn}>Track →</a>}
                        </div>
                    ))}
                </div>
            )}

            <div style={card}>
                <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>Items</h3>
                {(order.lines || []).map((l, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? "1px solid rgba(0,0,0,0.06)" : "none", fontSize: "0.92rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
                                {l.image
                                    ? <img src={`${l.image}${l.image.includes("?") ? "&" : "?"}width=150`} alt={l.name || l.styleCode || "item"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    : <span style={{ fontSize: 20 }}>🧵</span>}
                            </div>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {l.name ? <><b style={{ fontWeight: 600 }}>{l.name}</b><br /></> : null}
                                {[l.styleCode, l.colorName, l.sizeName].filter(Boolean).join(" · ")} × {l.qty}
                            </span>
                        </div>
                        <span style={{ whiteSpace: "nowrap" }}>{money((l.price || 0) * 100 * l.qty)}</span>
                    </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.12)", marginTop: 10, paddingTop: 10, display: "grid", gap: 4, fontSize: "0.9rem" }}>
                    <Row label="Subtotal" value={money((t.subtotal || 0) * 100)} />
                    {t.addOns > 0 && <Row label="Gift add-ons" value={money(t.addOns * 100)} />}
                    <Row label={order.shippingMethod ? `Shipping (${order.shippingMethod})` : "Shipping"} value={t.shipping ? money(t.shipping * 100) : "Free"} />
                    {t.tax > 0 && <Row label="Tax" value={money(t.tax * 100)} />}
                    <Row label={<b>Total</b>} value={<b>{money((t.total || 0) * 100)}</b>} />
                </div>
            </div>

            {order.giftAddOns?.length > 0 && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>🎁 Gift options</h3>
                    {order.giftAddOns.map((g, i) => (
                        <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.92rem" }}>
                                <span style={{ fontWeight: 600 }}>{g.label}</span>
                                <span style={{ color: "#64748b" }}>{g.priceCents > 0 ? money(g.priceCents) : "Free"}</span>
                            </div>
                            {g.message && <div style={{ marginTop: 4, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: "0.86rem", color: "#475569", fontStyle: "italic" }}>“{g.message}”</div>}
                        </div>
                    ))}
                </div>
            )}

            {order.shippingAddress && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>Shipping to</h3>
                    <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5 }}>
                        {order.shippingAddress.name}<br />
                        {order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ""}<br />
                        {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip].filter(Boolean).join(", ")}
                    </div>
                </div>
            )}

            <RequestReturn order={order} />
            <ContactSeller orderId={order.id} poNumber={order.poNumber} />
        </div>
    );
}

const REASONS = [["wrong_size", "Wrong size"], ["defective", "Defective / damaged"], ["not_as_described", "Not as described"], ["changed_mind", "Changed my mind"], ["arrived_late", "Arrived late"], ["other", "Other"]];

// Buyer-initiated return/exchange request.
function RequestReturn({ order }) {
    const [open, setOpen] = useState(false);
    const [picked, setPicked] = useState({});           // index → true
    const [resolution, setResolution] = useState("refund");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);
    const [error, setError] = useState(null);

    const lines = order.lines || [];
    const toggle = (i) => setPicked((p) => ({ ...p, [i]: !p[i] }));

    const submit = async () => {
        const items = lines.filter((_, i) => picked[i]).map((l) => ({ styleCode: l.styleCode, colorName: l.colorName, sizeName: l.sizeName, qty: l.qty, reason: REASONS[0][0] }));
        if (!items.length) { setError("Pick at least one item."); return; }
        setBusy(true); setError(null);
        try {
            const r = await fetch("/api/account/returns", {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ orderId: order.id, items, resolution, note }),
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            setDone(d.return);
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    if (done) return <div style={{ ...card, color: "#166534", background: "#dcfce7", border: "none" }}>Return <b>{done.rmaNumber}</b> requested — track it under <a href="/account/returns" style={{ color: "#166534", fontWeight: 700 }}>Returns</a>.</div>;

    return (
        <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Need to return something?</h3>
                {!open && <button onClick={() => setOpen(true)} style={ghostBtn}>Request a return</button>}
            </div>
            {open && (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    {lines.map((l, i) => (
                        <label key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem", cursor: "pointer" }}>
                            <input type="checkbox" checked={!!picked[i]} onChange={() => toggle(i)} />
                            {[l.styleCode, l.colorName, l.sizeName].filter(Boolean).join(" · ")} × {l.qty}
                        </label>
                    ))}
                    <label style={{ fontSize: "0.85rem", color: "#475569" }}>Resolution
                        <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ ...inputSx, marginTop: 4 }}>
                            <option value="refund">Refund</option><option value="store_credit">Store credit</option><option value="exchange">Exchange</option>
                        </select>
                    </label>
                    <textarea style={{ ...inputSx, minHeight: 70 }} placeholder="What went wrong? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
                    <button onClick={submit} disabled={busy} style={primaryBtn}>{busy ? "Submitting…" : "Submit return request"}</button>
                </div>
            )}
        </div>
    );
}

function Row({ label, value }) {
    return <div style={{ display: "flex", justifyContent: "space-between" }}><span>{label}</span><span>{value}</span></div>;
}

// Start a support thread tied to this order.
function ContactSeller({ orderId, poNumber }) {
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const send = async () => {
        if (!body.trim()) return;
        setBusy(true); setError(null);
        try {
            const r = await fetch("/api/account/messages", {
                method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ subject: `Question about order #${poNumber || orderId.slice(-6)}`, body, orderId }),
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            setSent(true);
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    if (sent) return <div style={{ ...card, color: "#166534", background: "#dcfce7", border: "none" }}>Message sent — the seller will reply in your <a href="/account/messages" style={{ color: "#166534", fontWeight: 700 }}>Messages</a>.</div>;

    return (
        <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Need help with this order?</h3>
                {!open && <button onClick={() => setOpen(true)} style={ghostBtn}>Contact seller</button>}
            </div>
            {open && (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <textarea style={{ ...inputSx, minHeight: 90, resize: "vertical" }} placeholder="How can the seller help?" value={body} onChange={(e) => setBody(e.target.value)} />
                    {error && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}
                    <button onClick={send} disabled={busy} style={primaryBtn}>{busy ? "Sending…" : "Send message"}</button>
                </div>
            )}
        </div>
    );
}
