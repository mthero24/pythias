"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

// Thank-you order summary. Stripe redirects here with ?payment_intent=… ; the order is created by the
// async webhook, so we poll briefly until it appears. Renders nothing if there's no order to show
// (e.g. the free-order path, which lands here with no payment_intent).
export default function OrderConfirmation() {
    const { price: money } = useI18n();
    const [state, setState] = useState({ status: "loading", order: null });

    useEffect(() => {
        const pi = new URLSearchParams(window.location.search).get("payment_intent");
        if (!pi) { setState({ status: "none", order: null }); return; }
        let tries = 0, alive = true, timer;
        const poll = async () => {
            try {
                const d = await (await fetch(`/api/checkout/confirmation?pi=${encodeURIComponent(pi)}`)).json();
                if (!alive) return;
                if (d.order) { setState({ status: "ready", order: d.order }); return; }
            } catch { /* retry below */ }
            if (++tries < 6) timer = setTimeout(poll, 1500);
            else if (alive) setState({ status: "none", order: null });
        };
        poll();
        return () => { alive = false; clearTimeout(timer); };
    }, []);

    if (state.status === "none") return null;
    if (state.status === "loading") return <div style={{ color: "var(--sf-muted,#64748b)", fontSize: "0.9rem" }}>Loading your order…</div>;

    const o = state.order, t = o.totals || {};
    const card = { background: "#fff", border: "1px solid var(--sf-border,#eef1f5)", borderRadius: 16, padding: 22, textAlign: "left", maxWidth: 520, margin: "24px auto 0" };
    return (
        <div style={card}>
            {o.poNumber && <div style={{ fontWeight: 700, marginBottom: 12 }}>Order #{o.poNumber}</div>}
            {o.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.92rem", borderTop: i ? "1px solid var(--sf-border,#f1f5f9)" : "none" }}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{l.name} × {l.qty}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{money(l.price * 100 * l.qty)}</span>
                </div>
            ))}
            {o.giftAddOns?.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sf-border,#eef1f5)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>🎁 Gift options</div>
                    {o.giftAddOns.map((g, i) => (
                        <div key={i} style={{ fontSize: "0.86rem", color: "#475569", marginTop: i ? 6 : 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>{g.label}</span><span>{g.priceCents > 0 ? money(g.priceCents) : "Free"}</span></div>
                            {g.message && <div style={{ fontStyle: "italic", marginTop: 2 }}>“{g.message}”</div>}
                        </div>
                    ))}
                </div>
            )}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--sf-border,#eef1f5)", display: "grid", gap: 4, fontSize: "0.9rem" }}>
                <Row label="Subtotal" value={money((t.subtotal || 0) * 100)} />
                {t.addOns > 0 && <Row label="Gift add-ons" value={money(t.addOns * 100)} />}
                <Row label={o.shippingMethod ? `Shipping (${o.shippingMethod})` : "Shipping"} value={t.shipping ? money(t.shipping * 100) : "Free"} />
                {t.tax > 0 && <Row label="Tax" value={money(t.tax * 100)} />}
                <Row label={<b>Total</b>} value={<b>{money((t.total || 0) * 100)}</b>} />
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--sf-muted,#64748b)" }}>{label}</span><span>{value}</span></div>;
}
