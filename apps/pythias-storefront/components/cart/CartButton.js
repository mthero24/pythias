"use client";
import { useCart } from "./CartProvider";

// Cart button. Floating by default (used standalone); pass inline to render inside the
// shared HeaderControls cluster alongside the account button.
export default function CartButton({ inline = false }) {
    const { count, ready } = useCart();
    if (!ready) return null;
    const floating = inline ? {} : { position: "fixed", top: 14, right: 16, zIndex: 50 };
    return (
        <a href="/cart" aria-label="Cart" style={{
            ...floating,
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700,
            padding: "8px 14px", borderRadius: 999, boxShadow: "0 2px 10px rgba(0,0,0,.18)", fontSize: "0.9rem",
        }}>
            🛒 {count > 0 ? count : ""}
        </a>
    );
}
