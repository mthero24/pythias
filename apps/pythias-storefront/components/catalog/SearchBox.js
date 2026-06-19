"use client";
import { useEffect, useRef, useState } from "react";

const termHref = (t) => `/products/${encodeURIComponent(String(t).toLowerCase().replace(/\s+/g, "-"))}`;
const go = (href) => { window.location.href = href; };

// Search box with typeahead: debounced suggestions from /api/search/suggest — matching products (thumb +
// title → product page) and matching terms (tags/categories → search). Navigates to /products?q=… on submit.
export default function SearchBox({ initial = "" }) {
    const [q, setQ] = useState(initial);
    const [sug, setSug] = useState({ products: [], terms: [] });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);   // keyboard-highlighted row across the flat suggestion list
    const boxRef = useRef(null);
    const blurTimer = useRef(null);

    // Flat list of selectable rows (products then terms) for keyboard nav.
    const rows = [
        ...sug.products.map((p) => ({ type: "product", href: p.href, label: p.title })),
        ...sug.terms.map((t) => ({ type: "term", href: termHref(t), label: t })),
    ];

    useEffect(() => {
        const t = q.trim();
        if (t.length < 2) { setSug({ products: [], terms: [] }); return; }
        const ctrl = new AbortController();
        const timer = setTimeout(() => {
            fetch(`/api/search/suggest?q=${encodeURIComponent(t)}`, { signal: ctrl.signal })
                .then((r) => r.json()).then((d) => { if (!d.error) { setSug({ products: d.products || [], terms: d.terms || [] }); setActive(-1); } })
                .catch(() => {});
        }, 180);
        return () => { clearTimeout(timer); ctrl.abort(); };
    }, [q]);

    useEffect(() => {
        const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const submit = (e) => {
        e?.preventDefault();
        if (active >= 0 && rows[active]) return go(rows[active].href);
        const t = q.trim();
        go(t ? `/products?q=${encodeURIComponent(t)}` : "/products");
    };

    const onKeyDown = (e) => {
        if (!open || !rows.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % rows.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? rows.length - 1 : i - 1)); }
        else if (e.key === "Escape") setOpen(false);
    };

    const showDropdown = open && q.trim().length >= 2 && (sug.products.length > 0 || sug.terms.length > 0);
    let idx = -1;   // running index to align hover/keyboard highlight with `rows`

    return (
        <div ref={boxRef} style={{ position: "relative", maxWidth: 520, marginBottom: 24 }}>
            <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
                <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
                    placeholder="Search products…" autoComplete="off"
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", fontSize: "1rem" }} />
                <button type="submit" style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Search</button>
            </form>

            {showDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "#fff", borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.16)", overflow: "hidden", maxHeight: "70vh", overflowY: "auto" }}>
                    {sug.products.map((p) => {
                        idx++; const a = idx;
                        return (
                            <a key={p.id} href={p.href} onMouseEnter={() => setActive(a)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", textDecoration: "none", color: "inherit", background: active === a ? "rgba(0,0,0,0.05)" : "transparent" }}>
                                <span style={{ width: 40, height: 40, borderRadius: 6, background: "#f3f4f6", flexShrink: 0, overflow: "hidden", display: "block" }}>
                                    {p.image && <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </span>
                                <span style={{ fontSize: "0.9rem" }}>{p.title}</span>
                            </a>
                        );
                    })}
                    {sug.terms.length > 0 && sug.products.length > 0 && <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />}
                    {sug.terms.map((t) => {
                        idx++; const a = idx;
                        return (
                            <a key={`t-${t}`} href={termHref(t)} onMouseEnter={() => setActive(a)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", textDecoration: "none", color: "inherit", background: active === a ? "rgba(0,0,0,0.05)" : "transparent" }}>
                                <span style={{ width: 40, textAlign: "center", opacity: 0.5, flexShrink: 0 }}>🔍</span>
                                <span style={{ fontSize: "0.9rem" }}>{t}</span>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
