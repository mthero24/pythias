import { StorefrontSite } from "@pythias/mongo";

// Resolve the storefront for an incoming request host.
//   brand.pythias.store  → subdomain lookup
//   mystore.com          → custom-domain lookup (must be active)
//   localhost / 127.*    → dev fallback to DEV_SITE_SLUG (treated as a subdomain)
//
// StorefrontSite lives in the platform/pythias DB (PlatformDB). One site per org.
export async function resolveSite(rawHost) {
    const base = (process.env.STOREFRONT_BASE_DOMAIN || "pythias.store").toLowerCase();
    const host = String(rawHost || "").toLowerCase().split(":")[0].trim();

    let query = null;
    const isLocal = !host || host === "localhost" || host.startsWith("127.") || host.endsWith(".localhost");

    if (isLocal) {
        const dev = (process.env.DEV_SITE_SLUG || "").toLowerCase();
        if (!dev) return null;
        query = { subdomain: dev };
    } else if (host === base || host.endsWith("." + base)) {
        const subdomain = host === base ? "" : host.slice(0, -(base.length + 1));
        if (!subdomain || subdomain === "www") return null;
        query = { subdomain };
    } else {
        // Custom domain — only serve once SSL/DNS is verified active.
        query = { "customDomain.hostname": host, "customDomain.status": "active" };
    }

    const site = await StorefrontSite.findOne(query).lean();
    if (!site) return null;
    // Don't serve disabled sites publicly.
    if (site.status === "disabled") return null;
    return site;
}
