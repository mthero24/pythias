"use client";
import { useState } from "react";
import AccountButton from "@/components/account/AccountButton";
import CartButton from "@/components/cart/CartButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

// One fixed top-right cluster holding search, account, favorites, and cart.
export default function HeaderControls() {
    return (
        <div style={{ position: "fixed", top: 14, right: 16, zIndex: 50, display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBox />
            <AccountButton />
            <FavoritesLink />
            <CartButton inline />
        </div>
    );
}

function SearchBox() {
    const [q, setQ] = useState("");
    const submit = (e) => { e.preventDefault(); window.location.href = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search"; };
    return (
        <form onSubmit={submit} style={{ display: "flex" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search products" style={{
                width: 140, padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.95)", fontSize: "0.85rem", boxShadow: "0 2px 10px rgba(0,0,0,.18)",
            }} />
        </form>
    );
}

function FavoritesLink() {
    const { count, ready } = useFavorites();
    if (!ready) return null;
    return (
        <a href="/favorites" aria-label="Favorites" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.95)", color: "#e11d48", fontWeight: 700,
            padding: "8px 13px", borderRadius: 999, boxShadow: "0 2px 10px rgba(0,0,0,.18)",
            fontSize: "0.9rem", textDecoration: "none", border: "1px solid rgba(0,0,0,0.06)",
        }}>
            ♥ {count > 0 ? count : ""}
        </a>
    );
}
