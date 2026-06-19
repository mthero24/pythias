"use client";
import { useCart } from "./CartProvider";

// Cart button. Floating by default (used standalone); pass inline to render inside the
// shared HeaderControls cluster alongside the account button.
export default function CartButton({ inline = false }) {
    const { count, ready, openDrawer } = useCart();
    if (!ready) return null;
    // Inline still needs a positioning context for the floating count badge.
    const pos = inline ? { position: "relative" } : { position: "fixed", top: 14, right: 16, zIndex: 50 };
    return (
        <button onClick={openDrawer} aria-label="Cart" style={{
            ...pos, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 38, height: 38, borderRadius: 999,
            background: "var(--sf-accent, #f59e0b)", color: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,.18)", fontSize: "1.05rem",
        }}>
            🛒
            {count > 0 && (
                <span style={{
                    position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 4px",
                    background: "#fff", color: "var(--sf-accent, #f59e0b)",
                    borderRadius: 999, fontSize: "0.68rem", fontWeight: 800, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                }}>{count}</span>
            )}
        </button>
    );
}
