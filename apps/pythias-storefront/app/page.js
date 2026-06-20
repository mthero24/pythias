import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { SiteFrame, SectionRenderer } from "@pythias/storefront";
import { resolveSectionData } from "@pythias/storefront/server";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";
import { sectionExperimentsForPage } from "@/lib/experiments";
import SectionVariants from "@/components/experiments/SectionVariants";

export const dynamic = "force-dynamic"; // resolve the site per request host

export async function generateMetadata() {
    return siteMetadata();
}

// The bare storefront host (store.pythiastechnologies.com) isn't a store — it's the
// seller front door. Send it to the platform's existing signup flow ("use platform as
// the storefront code"), rather than showing the generic no-store page.
function isApexHost(rawHost) {
    const host = String(rawHost || "").toLowerCase().split(":")[0].trim();
    const base = (process.env.STOREFRONT_BASE_DOMAIN || "pythias.store").toLowerCase();
    return host === base || host === "www." + base;
}

export default async function HomePage({ searchParams }) {
    const preview = previewAllowed(await searchParams);
    const h = await headers();
    const live = await resolveSite(h.get("host"));
    if (!live) {
        if (isApexHost(h.get("host"))) {
            const platform = process.env.PLATFORM_PUBLIC_BASE || "https://platform.pythiastechnologies.com";
            redirect(`${platform}/register?type=commerce`);
        }
        return <NoSite />;
    }
    const site = withDraft(live, preview);

    const home = (site.pages ?? []).find((p) => p.slug === "home") ?? (site.pages ?? [])[0] ?? { sections: [] };
    const data = await resolveSectionData(home.sections ?? [], { orgId: site.orgId });
    const experiments = preview ? {} : await sectionExperimentsForPage(site.orgId, home.slug || "home");

    return (
        <SiteFrame site={site}>
            <SectionRenderer sections={home.sections ?? []} site={site} data={data} experiments={experiments} ExperimentSlot={SectionVariants} />
        </SiteFrame>
    );
}
