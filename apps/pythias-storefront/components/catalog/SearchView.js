"use client";
import { useEffect, useState } from "react";
import FilterableProductGrid from "@/components/catalog/FilterableProductGrid";

export default function SearchView() {
    const [q, setQ] = useState("");
    const [input, setInput] = useState("");
    const [products, setProducts] = useState(null);

    // Read ?q= on mount (avoids useSearchParams Suspense boundary).
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search).get("q") || "";
        setQ(sp); setInput(sp);
    }, []);

    useEffect(() => {
        let alive = true;
        fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => { if (alive) setProducts(d.error ? [] : d.products); }).catch(() => alive && setProducts([]));
        return () => { alive = false; };
    }, [q]);

    const submit = (e) => {
        e.preventDefault();
        const next = input.trim();
        setQ(next);
        const url = next ? `/search?q=${encodeURIComponent(next)}` : "/search";
        window.history.replaceState(null, "", url);
    };

    return (
        <div>
            <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 24, maxWidth: 520 }}>
                <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products…"
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", fontSize: "1rem" }} />
                <button type="submit" style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Search</button>
            </form>
            <h1 style={{ fontSize: "1.4rem", margin: "0 0 18px" }}>{q ? `Results for “${q}”` : "All products"}</h1>
            {products === null ? <p style={{ opacity: 0.6 }}>Searching…</p> : <FilterableProductGrid products={products} emptyText={q ? `No products match “${q}”.` : "No products yet."} />}
        </div>
    );
}
