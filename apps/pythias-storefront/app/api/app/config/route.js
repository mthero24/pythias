export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/app/config — bootstrap for the white-label native mobile app.
// The app sends its x-pythias-app-key header (resolveOrg maps it → the store). We return the store's
// brand, theme, navigation, and feature flags so the app can render its shell and theme itself.
// Gated by the appEnabled add-on (the seller's paid mobile-app upgrade).
export async function GET(req) {
    const ctx = await resolveOrg(req);
    if (!ctx?.site) return NextResponse.json({ error: "unknown_app" }, { status: 404 });
    const site = ctx.site;
    if (!site.appEnabled) return NextResponse.json({ error: "app_not_enabled" }, { status: 403 });

    const theme = site.theme || {};
    const ann = site.announcement || {};

    return NextResponse.json({
        store: {
            id: String(site.orgId),
            name: site.name || "My store",
            tagline: site.tagline || "",
            logoUrl: theme.logoUrl || site.logoUrl || "",
            logoStyle: site.logoStyle || "logo",
            logoHeight: site.logoHeight || 32,
        },
        // The full theme token set — the app reads primary/accent/fonts/etc. and themes itself to match web.
        theme: {
            baseThemeId: theme.baseThemeId || "apparel",
            primary: theme.primary || "#111827",
            accent: theme.accent || "#f59e0b",
            ...theme,
        },
        nav: site.nav || null,
        footer: site.footer || null,
        announcement: ann.enabled ? { text: ann.text || "", bg: ann.bg || theme.accent || "#f59e0b", link: ann.link || "" } : null,
        features: {
            accounts: true,
            favorites: true,
            reviews: site.reviews?.enabled !== false,
            giftCards: !!site.giftCards?.enabled,
            cartAddOns: Array.isArray(site.cartAddOns) ? site.cartAddOns.filter((a) => a?.enabled).length > 0 : false,
        },
        // Endpoints the app drives off of (kept here so the binary doesn't hard-code paths).
        endpoints: {
            products: "/api/app/products",
            search: "/api/search",
            shipping: "/api/site/shipping",
            checkoutQuote: "/api/checkout/quote",
            checkoutIntent: "/api/checkout/intent",
            checkoutPlace: "/api/checkout/place",
            account: "/api/account",
        },
    });
}
