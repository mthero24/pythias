"use client";
import { useState } from "react";

// Navigates to /products?q=… (browse + search now live on one page).
export default function SearchBox({ initial = "" }) {
    const [q, setQ] = useState(initial);
    const submit = (e) => {
        e.preventDefault();
        const t = q.trim();
        window.location.href = t ? `/products?q=${encodeURIComponent(t)}` : "/products";
    };
    return (
        <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 520 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", fontSize: "1rem" }} />
            <button type="submit" style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Search</button>
        </form>
    );
}
