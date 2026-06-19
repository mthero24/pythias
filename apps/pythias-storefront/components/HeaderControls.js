"use client";
import { useEffect, useRef, useState } from "react";
import AccountButton from "@/components/account/AccountButton";
import CartButton from "@/components/cart/CartButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

// One fixed top-right cluster holding search, locale, account, favorites, and cart.
export default function HeaderControls() {
    return (
        <div style={{ position: "fixed", top: 14, right: 16, zIndex: 50, display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBox />
            <LocaleSwitch />
            <AccountButton />
            <FavoritesLink />
            <CartButton inline />
        </div>
    );
}

const termHref = (t) => `/products/${encodeURIComponent(String(t).toLowerCase().replace(/\s+/g, "-"))}`;

function SearchBox() {
    const { t } = useI18n();
    const [q, setQ] = useState("");
    const [sug, setSug] = useState({ products: [], terms: [] });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const boxRef = useRef(null);

    const rows = [
        ...sug.products.map((p) => ({ href: p.href })),
        ...sug.terms.map((tt) => ({ href: termHref(tt) })),
    ];

    useEffect(() => {
        const term = q.trim();
        if (term.length < 2) { setSug({ products: [], terms: [] }); return; }
        const ctrl = new AbortController();
        const timer = setTimeout(() => {
            fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
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
        if (active >= 0 && rows[active]) { window.location.href = rows[active].href; return; }
        window.location.href = q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products";
    };
    const onKeyDown = (e) => {
        if (!open || !rows.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % rows.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i <= 0 ? rows.length - 1 : i - 1)); }
        else if (e.key === "Escape") setOpen(false);
    };

    const showDropdown = open && q.trim().length >= 2 && (sug.products.length > 0 || sug.terms.length > 0);
    let idx = -1;

    return (
        <div ref={boxRef} style={{ position: "relative" }}>
            <form onSubmit={submit} style={{ display: "flex" }}>
                <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
                    placeholder={t("nav.search", "Search…")} aria-label="Search products" autoComplete="off" style={{
                        width: 140, padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.95)", fontSize: "0.85rem", boxShadow: "0 2px 10px rgba(0,0,0,.18)",
                    }} />
            </form>
            {showDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 300, maxWidth: "80vw", background: "#fff", borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)", overflow: "hidden", maxHeight: "70vh", overflowY: "auto", color: "#111" }}>
                    {sug.products.map((p) => {
                        idx++; const a = idx;
                        return (
                            <a key={p.id} href={p.href} onMouseEnter={() => setActive(a)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", textDecoration: "none", color: "inherit", background: active === a ? "rgba(0,0,0,0.05)" : "transparent" }}>
                                <span style={{ width: 36, height: 36, borderRadius: 6, background: "#f3f4f6", flexShrink: 0, overflow: "hidden", display: "block" }}>
                                    {p.image && <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </span>
                                <span style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                            </a>
                        );
                    })}
                    {sug.terms.length > 0 && sug.products.length > 0 && <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />}
                    {sug.terms.map((tt) => {
                        idx++; const a = idx;
                        return (
                            <a key={`t-${tt}`} href={termHref(tt)} onMouseEnter={() => setActive(a)}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", textDecoration: "none", color: "inherit", background: active === a ? "rgba(0,0,0,0.05)" : "transparent" }}>
                                <span style={{ width: 36, textAlign: "center", opacity: 0.5, flexShrink: 0 }}>🔍</span>
                                <span style={{ fontSize: "0.85rem" }}>{tt}</span>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Currency + language pickers — only shown when the store offers more than one.
function LocaleSwitch() {
    const { currencies, languages, currency, setCurrency, lang, setLang } = useI18n();
    const selStyle = { padding: "7px 8px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.95)", fontSize: "0.8rem", boxShadow: "0 2px 10px rgba(0,0,0,.18)" };
    return (
        <>
            {currencies?.length > 1 && (
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" style={selStyle}>
                    {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
            )}
            {languages?.length > 1 && (
                <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language" style={selStyle}>
                    {languages.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
            )}
        </>
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
