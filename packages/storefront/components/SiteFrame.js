import { themeVars } from "../lib/theme";
import SiteScripts from "./SiteScripts";

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
    const footer = site.footer ?? {};
    const brand = t.logoUrl
        ? <img src={t.logoUrl} alt={site.name ?? "Store"} style={{ height: 32 }} />
        : <span style={{ fontWeight: 800, fontSize: "1.15rem", fontFamily: "var(--sf-font-heading)" }}>{site.name ?? site.subdomain}</span>;

    return (
        <div style={style}>
            <SiteScripts site={site} />
            <header style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="sf-container" style={{ display: "flex", alignItems: "center", gap: 24, height: 64 }}>
                    <a href="/">{brand}</a>
                    <nav style={{ display: "flex", gap: 20, marginLeft: "auto", fontSize: "0.95rem" }}>
                        {(nav.links ?? []).map((l, i) => <a key={i} href={l.href || "#"}>{l.label}</a>)}
                    </nav>
                </div>
            </header>

            <main style={{ flex: 1 }}>{children}</main>

            <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 40, padding: "32px 0" }}>
                <div className="sf-container" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{footer.text || `© ${site.name ?? site.subdomain}`}</div>
                    <nav style={{ display: "flex", gap: 16, fontSize: "0.85rem" }}>
                        {(footer.links ?? []).map((l, i) => <a key={i} href={l.href || "#"}>{l.label}</a>)}
                    </nav>
                </div>
            </footer>
        </div>
    );
}
