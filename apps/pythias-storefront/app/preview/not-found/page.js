import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { SiteFrame, SpecialPage, SPECIAL_DEFAULTS } from "@pythias/storefront";
import NoSite from "@/components/NoSite";

export const dynamic = "force-dynamic";

// Editor preview of the custom 404 (the real one is app/not-found.js, which isn't a normal route).
export default async function NotFoundPreview({ searchParams }) {
    const preview = previewAllowed(await searchParams);
    const live = await resolveSite((await headers()).get("host"));
    if (!live) return <NoSite />;
    const site = withDraft(live, preview);
    const d = SPECIAL_DEFAULTS.notFound;
    const c = site.system?.notFound || {};
    return (
        <SiteFrame site={site}>
            <SpecialPage code="404" title={c.title || d.title} message={c.message || d.message} ctaText={c.ctaText || d.ctaText} ctaLink={c.ctaLink || d.ctaLink} backgroundImage={c.backgroundImage} />
        </SiteFrame>
    );
}
