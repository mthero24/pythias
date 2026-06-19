"use client";
import { useEffect, useState } from "react";

// Header menu. Two layouts:
//  • "links"  — horizontal top links; a link with `children` is a hover/tap dropdown section.
//  • "drawer" — a hamburger button that opens a slide-out panel listing sections + links.
// `icon` (emoji/glyph) renders before the label in either mode.
export default function SiteNav({ links = [], style = "links", side = "right", brand = null }) {
    if (!links.length) return null;
    if (style === "drawer") return <DrawerNav links={links} side={side} brand={brand} />;
    // "links" style: horizontal links on desktop, but a drawer on mobile so they never overflow.
    return (
        <>
            <span className="sf-only-desktop" style={{ display: "contents" }}><LinksNav links={links} /></span>
            <span className="sf-only-mobile"><DrawerNav links={links} side={side} brand={brand} /></span>
        </>
    );
}

const Ico = ({ icon }) => (icon ? <span style={{ marginRight: 6 }}>{icon}</span> : null);

// ── Horizontal links (with dropdown sections) ────────────────────────────────
function LinksNav({ links }) {
    return (
        <nav style={{ display: "flex", gap: 20, fontSize: "0.95rem", alignItems: "center" }}>
            {links.map((l, i) => (
                l.children?.length
                    ? <Dropdown key={i} item={l} />
                    : <a key={i} href={l.href || "#"} style={{ color: "inherit", textDecoration: "none" }}><Ico icon={l.icon} />{l.label}</a>
            ))}
        </nav>
    );
}

function Dropdown({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <a href={item.href || "#"} onClick={(e) => { if (!item.href) e.preventDefault(); setOpen((o) => !o); }}
                style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <span><Ico icon={item.icon} />{item.label}</span>
                <span style={{ fontSize: "0.7em", opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}>▾</span>
            </a>
            {open && (
                <div style={{ position: "absolute", top: "100%", left: 0, paddingTop: 8, zIndex: 60 }}>
                    <div style={{ background: "#fff", color: "#111", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 190, padding: "6px 0" }}>
                        {item.children.map((c, j) => (
                            <a key={j} href={c.href || "#"}
                                style={{ display: "block", padding: "9px 16px", color: "#111", textDecoration: "none", fontSize: "0.9rem", whiteSpace: "nowrap" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                <Ico icon={c.icon} />{c.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Hamburger → slide-out drawer ─────────────────────────────────────────────
// Which edge the panel docks to + its drop shadow.
const PANEL_POS = {
    right:  { top: 0, right: 0, bottom: 0, width: "min(320px,86vw)" },
    left:   { top: 0, left: 0, bottom: 0, width: "min(320px,86vw)" },
    top:    { top: 0, left: 0, right: 0, maxHeight: "82vh" },
    bottom: { bottom: 0, left: 0, right: 0, maxHeight: "82vh" },
};
const PANEL_SHADOW = { right: "-8px 0 30px", left: "8px 0 30px", top: "0 8px 30px", bottom: "0 -8px 30px" };

function DrawerNav({ links, side = "right", brand = null }) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [open]);
    const pos = PANEL_POS[side] || PANEL_POS.right;
    const brandEl = brand?.logoUrl
        ? <img src={brand.logoUrl} alt={brand.name || "Store"} style={{ height: Math.min(40, Number(brand.logoHeight) || 32), width: "auto", display: "block" }} />
        : <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111" }}>{brand?.name || ""}</span>;
    return (
        <div>
            <button onClick={() => setOpen(true)} aria-label="Open menu"
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1.5rem", lineHeight: 1, padding: 4 }}>☰</button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1400 }} />
                    <div style={{ position: "fixed", ...pos, background: "#fff", color: "#111", zIndex: 1401, boxShadow: `${PANEL_SHADOW[side] || PANEL_SHADOW.right} rgba(16,24,40,0.2)`, overflowY: "auto", padding: "14px 0" }}>
                        {/* Store branding at the top of the drawer */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 16px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 6 }}>
                            <a href="/" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center", minWidth: 0 }}>{brandEl}</a>
                            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b", lineHeight: 1, flexShrink: 0 }}>×</button>
                        </div>
                        {links.map((l, i) => (
                            <div key={i}>
                                <a href={l.href || (l.children?.length ? undefined : "#")} onClick={(e) => { if (!l.href && l.children?.length) e.preventDefault(); }}
                                    style={{ display: "flex", alignItems: "center", padding: "11px 20px", color: "#111", textDecoration: "none", fontWeight: l.children?.length ? 700 : 500, fontSize: "0.98rem" }}>
                                    <Ico icon={l.icon} />{l.label}
                                </a>
                                {l.children?.map((c, j) => (
                                    <a key={j} href={c.href || "#"} onClick={() => setOpen(false)}
                                        style={{ display: "flex", alignItems: "center", padding: "9px 20px 9px 36px", color: "#334155", textDecoration: "none", fontSize: "0.92rem" }}>
                                        <Ico icon={c.icon} />{c.label}
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
