"use client";
import { useState } from "react";
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

function SearchBox() {
    const { t } = useI18n();
    const [q, setQ] = useState("");
    const submit = (e) => { e.preventDefault(); window.location.href = q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products"; };
    return (
        <form onSubmit={submit} style={{ display: "flex" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search", "Search…")} aria-label="Search products" style={{
                width: 140, padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.95)", fontSize: "0.85rem", boxShadow: "0 2px 10px rgba(0,0,0,.18)",
            }} />
        </form>
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
