"use client";
import { useCart } from "./CartProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

// Optional "added to cart" confirmation modal. Opens only when the store enables it
// (site.catalog.addToCartModal → window.__SF__.cartModal, checked in CartProvider.add).
export default function CartModal() {
    const { modal, closeModal, count, subtotalCents } = useCart();
    const { price: money } = useI18n();
    if (!modal) return null;

    const meta = [modal.color, modal.size].filter(Boolean).join(" · ");
    return (
        <div onClick={closeModal} role="dialog" aria-modal="true"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8vh 16px" }}>
            <div onClick={(e) => e.stopPropagation()}
                style={{ background: "#fff", borderRadius: 14, maxWidth: 420, width: "100%", padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ color: "#16a34a", fontWeight: 700, flex: 1 }}>✓ Added to cart</span>
                    <button onClick={closeModal} aria-label="Close" style={{ background: "none", border: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "#64748b" }}>×</button>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0 }}>
                        {modal.image && <img src={modal.image} alt={modal.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{modal.title}</div>
                        {meta && <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{meta}</div>}
                        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Qty {modal.qty}</div>
                    </div>
                    {modal.priceCents > 0 && <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{money(modal.priceCents * modal.qty)}</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: 14, color: "#334155", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12 }}>
                    <span>{count} item{count === 1 ? "" : "s"} in cart</span>
                    <span style={{ fontWeight: 700 }}>{money(subtotalCents)}</span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={closeModal} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Keep shopping</button>
                    <a href="/cart" style={{ flex: 1, padding: "11px 0", borderRadius: 8, background: "var(--sf-accent,#f59e0b)", color: "#fff", textAlign: "center", textDecoration: "none", fontWeight: 700 }}>View cart</a>
                </div>
                <a href="/checkout" style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--sf-secondary)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>Checkout →</a>
            </div>
        </div>
    );
}
