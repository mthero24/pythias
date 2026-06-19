import { themeVars } from "../lib/theme";
import SiteScripts from "./SiteScripts";
import SiteNav from "./SiteNav";
import PaymentMarks from "./PaymentMarks";
import FooterNewsletter from "./FooterNewsletter";

// Wraps page content with the site's theme (CSS variables), header nav, and footer.
export default function SiteFrame({ site, children }) {
    const t = site.theme ?? {};
    const style = {
        ...themeVars(t),
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
    };

    const nav = site.nav ?? {};
    const isDrawer = (nav.style || "links") === "drawer";
    const footer = site.footer ?? {};
    // Auto-link any written policy pages in the footer (legal links must be reachable — Stripe requires it).
    const policyLinks = (site.policies ?? [])
        .filter((p) => p && p.slug && p.body && String(p.body).trim())
        .map((p) => ({ label: p.title || p.slug, href: `/policies/${p.slug}` }));
    // Footer columns (sections with children) vs standalone links. Policy links + sitemap are always
    // appended to the bottom bar so legal pages stay reachable (Stripe requires it).
    const footerCols = (footer.links ?? []).filter((l) => l.children?.length);
    const footerFlat = (footer.links ?? []).filter((l) => !l.children?.length);
    const bottomLinks = [...footerFlat, ...policyLinks, { label: "Sitemap", href: "/sitemap" }];
    const socials = (footer.socials ?? []).filter((s) => s.url);
    // Footer colors — default to the theme's primary with a light text tone so the footer reads as an
    // intentional band (not a blank white strip). Sellers can override either color.
    const footerBg = footer.bg || "var(--sf-primary, #0f172a)";
    const footerFg = footer.fg || "#e8eaf0";
    const badges = (footer.badges ?? []).filter((b) => b.image || b.label);
    const showPayments = footer.showPayments !== false;
    const showBrand = footer.showBrand !== false;
    // Brand lockup honoring the seller's logo style + size. Falls back to the store name when
    // there's no logo regardless of style.
    const storeName = site.name ?? site.subdomain;
    const logoH = Number(t.logoHeight) || 32;
    const style2 = t.logoUrl ? (t.logoStyle || "logo") : "name";
    const nameEl = <span style={{ fontWeight: 800, fontSize: "1.15rem", fontFamily: "var(--sf-font-heading)", color: "var(--sf-text)" }}>{storeName}</span>;
    const logoEl = <img src={t.logoUrl} alt={storeName ?? "Store"} style={{ height: logoH, width: "auto", display: "block" }} />;
    const brand = style2 === "name" ? nameEl
        : style2 === "logoName"
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{logoEl}{nameEl}</span>
            : logoEl;

    return (
        <div style={style}>
            <SiteScripts site={site} />
            <header style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="sf-container" style={{ display: "flex", alignItems: "center", gap: 16, height: 64 }}>
                    {/* Drawer style: hamburger sits to the LEFT of the logo. */}
                    {isDrawer && <SiteNav links={nav.links ?? []} style="drawer" side={nav.drawerSide || "right"} brand={{ name: storeName, logoUrl: t.logoUrl, logoHeight: logoH }} />}
                    <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1 }}>
                            {brand}
                            {t.tagline && <span style={{ fontSize: "0.72rem", opacity: 0.65, marginTop: 2 }}>{t.tagline}</span>}
                        </span>
                    </a>
                    {/* Links style: nav + controls grouped on the right. Drawer: just the controls on the right. */}
                    {isDrawer ? (
                        <div id="sf-header-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }} />
                    ) : (
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
                            <SiteNav links={nav.links ?? []} style="links" side={nav.drawerSide || "right"} brand={{ name: storeName, logoUrl: t.logoUrl, logoHeight: logoH }} />
                            <div id="sf-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }} />
                        </div>
                    )}
                </div>
            </header>

            <main style={{ flex: 1 }}>{children}</main>

            <footer style={{ background: footerBg, color: footerFg, marginTop: 40, padding: "44px 0 28px" }}>
                <div className="sf-container">
                    {footer.newsletter?.enabled && <FooterNewsletter config={footer.newsletter} fg={footerFg} />}
                    {(showBrand || footerCols.length > 0) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 48, marginBottom: 28 }}>
                            {showBrand && (
                                <div style={{ flex: "1 1 220px", minWidth: 200, maxWidth: 340 }}>
                                    <a href="/" style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}>
                                        {t.logoUrl
                                            ? <img src={t.logoUrl} alt={storeName} style={{ height: Math.min(46, logoH * 1.3), width: "auto", display: "block", marginBottom: 10 }} />
                                            : <div style={{ fontWeight: 800, fontSize: "1.15rem", marginBottom: 10 }}>{storeName}</div>}
                                    </a>
                                    {footer.tagline && <div style={{ fontSize: "0.85rem", opacity: 0.72, lineHeight: 1.55, marginBottom: 12 }}>{footer.tagline}</div>}
                                    {socials.length > 0 && (
                                        <nav style={{ display: "flex", gap: 14, fontSize: "0.85rem", flexWrap: "wrap" }}>
                                            {socials.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none", opacity: 0.85 }}>{s.platform || "Link"}</a>)}
                                        </nav>
                                    )}
                                </div>
                            )}
                            {footerCols.map((c, i) => (
                                <div key={i} style={{ minWidth: 140 }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>{c.icon ? `${c.icon} ` : ""}{c.label}</div>
                                    <nav style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.85rem" }}>
                                        {c.children.map((x, j) => <a key={j} href={x.href || "#"} style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>{x.icon ? `${x.icon} ` : ""}{x.label}</a>)}
                                    </nav>
                                </div>
                            ))}
                        </div>
                    )}
                    {(badges.length > 0 || showPayments) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", paddingBottom: 18 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                                {badges.map((b, i) => {
                                    const inner = b.image
                                        ? <img src={b.image} alt={b.label || "badge"} style={{ height: 40, width: "auto", display: "block", borderRadius: 6 }} />
                                        : <span style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.28)", borderRadius: 999, padding: "6px 13px", fontSize: "0.8rem", fontWeight: 600 }}>{b.icon ? `${b.icon} ` : ""}{b.label}</span>;
                                    return b.url ? <a key={i} href={b.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{inner}</a> : <span key={i}>{inner}</span>;
                                })}
                            </div>
                            {showPayments && <PaymentMarks />}
                        </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 18 }}>
                        <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{footer.text || `© ${site.name ?? site.subdomain}`}</div>
                        <nav style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: "0.85rem" }}>
                            {bottomLinks.map((l, i) => <a key={i} href={l.href || "#"} style={{ color: "inherit", textDecoration: "none" }}>{l.label}</a>)}
                        </nav>
                        {!showBrand && socials.length > 0 && (
                            <nav style={{ display: "flex", gap: 14, fontSize: "0.85rem" }}>
                                {socials.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>{s.platform || "Link"}</a>)}
                            </nav>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
