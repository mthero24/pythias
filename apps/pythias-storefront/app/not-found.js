import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame, SpecialPage, SPECIAL_DEFAULTS } from "@pythias/storefront";

export const dynamic = "force-dynamic";

// Per-store custom 404. Sellers edit the copy in the editor (site.system.notFound); falls back to defaults.
export default async function NotFound() {
    let site = null;
    try { site = await resolveSite((await headers()).get("host")); } catch { /* host unresolved */ }

    const d = SPECIAL_DEFAULTS.notFound;
    const c = site?.system?.notFound || {};
    const body = (
        <SpecialPage code="404"
            title={c.title || d.title}
            message={c.message || d.message}
            ctaText={c.ctaText || d.ctaText}
            ctaLink={c.ctaLink || d.ctaLink}
            backgroundImage={c.backgroundImage} />
    );

    if (!site) {
        return (
            <section style={{ padding: "90px 0", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
                <h1 style={{ margin: "0 0 8px" }}>Page not found</h1>
                <p style={{ opacity: 0.6 }}><a href="/">Go home</a></p>
            </section>
        );
    }
    return <SiteFrame site={site}>{body}</SiteFrame>;
}
