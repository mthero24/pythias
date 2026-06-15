// Turn a site theme into the CSS custom properties the sections read.
// Used by SiteFrame (live site) and the editor preview so both render identically.
export function themeVars(theme = {}) {
    const c = theme.colors ?? {};
    const f = theme.fonts ?? {};
    return {
        "--sf-primary": c.primary || "#1a1a2e",
        "--sf-secondary": c.secondary || "#e94560",
        "--sf-bg": c.background || "#ffffff",
        "--sf-text": c.text || "#111111",
        "--sf-accent": c.accent || "#f59e0b",
        "--sf-font-heading": f.heading ? `${f.heading}, system-ui, sans-serif` : "Inter, system-ui, sans-serif",
        "--sf-font-body": f.body ? `${f.body}, system-ui, sans-serif` : "Inter, system-ui, sans-serif",
    };
}
