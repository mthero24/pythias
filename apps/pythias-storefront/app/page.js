import { headers } from "next/headers";
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

export default async function HomePage({ searchParams }) {
    const preview = previewAllowed(await searchParams);
    const h = await headers();
    const live = await resolveSite(h.get("host"));
    if (!live) return <NoSite />;
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
