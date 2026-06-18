import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { SiteFrame, SpecialPage, SPECIAL_DEFAULTS } from "@pythias/storefront";
import NoSite from "@/components/NoSite";

export const dynamic = "force-dynamic";

// Editor preview of the custom error page (the real one is the client error boundary in app/error.js).
export default async function ErrorPreview({ searchParams }) {
    const preview = previewAllowed(await searchParams);
    const live = await resolveSite((await headers()).get("host"));
    if (!live) return <NoSite />;
    const site = withDraft(live, preview);
    const d = SPECIAL_DEFAULTS.error;
    const c = site.system?.error || {};
    return (
        <SiteFrame site={site}>
            <SpecialPage title={c.title || d.title} message={c.message || d.message} ctaText={c.ctaText || d.ctaText} ctaLink={c.ctaLink || d.ctaLink} />
        </SiteFrame>
    );
}
