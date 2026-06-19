"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AccountButton from "@/components/account/AccountButton";
import CartButton from "@/components/cart/CartButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

// Search, locale, account, favorites, and cart. Two placements, swapped on scroll:
//  • At the top → rendered INSIDE the header bar (portaled into SiteFrame's #sf-header-actions slot),
//    so the cart/search are always visible without covering the menu.
//  • Scrolled past the header → a fixed top-right floating cluster, so they stay reachable.
export default function HeaderControls() {
    const [shown, setShown] = useState(false);
    const [slot, setSlot] = useState(null);
    const [floating, setFloating] = useState(true);   // seller can disable the floating-on-scroll cluster
    useEffect(() => {
        setSlot(document.getElementById("sf-header-actions"));
        setFloating(window.__SF__?.floatingControls !== false);
        const onScroll = () => setShown(window.scrollY > 80);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const controls = (
        <>
            <SearchBox />
            <LocaleSwitch />
            <AccountButton />
            <FavoritesLink />
            <CartButton inline />
        </>
    );

    // At the top (header visible), or with floating turned off → keep the controls in the header bar.
    if (slot && (!shown || !floating)) return createPortal(<div style={{ display: "flex", alignItems: "center", gap: 10 }}>{controls}</div>, slot);

    // Floating disabled and no header slot on this page → nothing floats.
    if (!floating) return null;

    // Scrolled, or no header slot → fixed floating cluster (fades in).
    return (
        <div style={{
            position: "fixed", top: 14, right: 16, zIndex: 50, display: "flex", gap: 10, alignItems: "center",
            opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(-12px)",
            pointerEvents: shown ? "auto" : "none", transition: "opacity 200ms ease, transform 200ms ease",
        }}>
            {controls}
        </div>
    );
}

// Shared pill surface that follows the site palette (resolves via :root vars set by SiteScripts).
const PILL_BG = "var(--sf-bg, #ffffff)";
const PILL_TEXT = "var(--sf-text, #111111)";
const pillBase = { background: PILL_BG, color: PILL_TEXT, border: "1px solid rgba(128,128,128,0.25)", boxShadow: "0 2px 10px rgba(0,0,0,.18)" };

const termHref = (t) => `/products/${encodeURIComponent(String(t).toLowerCase().replace(/\s+/g, "-"))}`;

function SearchBox() {
    const { t } = useI18n();
    const [q, setQ] = useState("");
    const [sug, setSug] = useState({ products: [], terms: [] });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [mobile, setMobile] = useState(false);
    const [overlay, setOverlay] = useState(false);   // mobile full-width search sheet
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

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 600px)");
        const on = () => setMobile(mq.matches);
        on(); mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
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

    // Suggestions dropdown — reused by the desktop inline box and the mobile search sheet.
    const dropdown = (extra) => {
        let idx = -1;
        return (
            <div style={{ width: 300, maxWidth: "92vw", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)", overflow: "hidden", maxHeight: "70vh", overflowY: "auto", color: "#111", ...extra }}>
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
        );
    };

    const inputEl = (full) => (
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
            autoFocus={full} placeholder={t("nav.search", "Search…")} aria-label="Search products" autoComplete="off"
            style={{ ...pillBase, ...(full ? { flex: 1, boxShadow: "none" } : { width: 140 }), padding: "10px 14px", borderRadius: 999, fontSize: "0.9rem" }} />
    );

    // Mobile: a search icon that opens a full-width search sheet (keeps the header from overflowing).
    if (mobile) {
        return (
            <>
                <button onClick={() => { setOverlay(true); setOpen(true); }} aria-label="Search" style={{ ...pillBase, width: 38, height: 38, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1rem" }}>🔍</button>
                {overlay && createPortal(
                    <div onMouseDown={() => setOverlay(false)} style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(0,0,0,0.45)" }}>
                        <div onMouseDown={(e) => e.stopPropagation()} style={{ background: "var(--sf-bg, #fff)", color: "var(--sf-text, #111)", padding: 12 }}>
                            <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {inputEl(true)}
                                <button type="button" onClick={() => setOverlay(false)} style={{ border: "none", background: "none", color: "inherit", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Cancel</button>
                            </form>
                            {showDropdown && <div style={{ marginTop: 8 }}>{dropdown({ position: "static", width: "100%", maxWidth: "100%", boxShadow: "none", border: "1px solid rgba(0,0,0,0.1)" })}</div>}
                        </div>
                    </div>, document.body)}
            </>
        );
    }

    // Desktop: inline search box with an anchored dropdown.
    return (
        <div ref={boxRef} style={{ position: "relative" }}>
            <form onSubmit={submit} style={{ display: "flex" }}>{inputEl(false)}</form>
            {showDropdown && dropdown({ position: "absolute", top: "calc(100% + 6px)", right: 0 })}
        </div>
    );
}

// Currency + language pickers — only shown when the store offers more than one.
function LocaleSwitch() {
    const { currencies, languages, currency, setCurrency, lang, setLang } = useI18n();
    const selStyle = { ...pillBase, padding: "7px 8px", borderRadius: 999, fontSize: "0.8rem" };
    if (!(currencies?.length > 1) && !(languages?.length > 1)) return null;
    return (
        <span className="sf-hide-mobile" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
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
        </span>
    );
}

function FavoritesLink() {
    const { count, ready } = useFavorites();
    if (!ready) return null;
    return (
        <a href="/favorites" aria-label="Favorites" style={{
            ...pillBase, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "var(--sf-secondary, #e11d48)", width: 38, height: 38, borderRadius: 999, fontSize: "1.05rem", textDecoration: "none",
        }}>
            ♥
            {count > 0 && (
                <span style={{
                    position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 4px",
                    background: "var(--sf-secondary, #e11d48)", color: "#fff",
                    borderRadius: 999, fontSize: "0.68rem", fontWeight: 800, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                }}>{count}</span>
            )}
        </a>
    );
}
