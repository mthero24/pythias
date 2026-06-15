import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame, SectionRenderer } from "@pythias/storefront";
import { resolveSectionData } from "@pythias/storefront/server";
import NoSite from "@/components/NoSite";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic"; // resolve the site per request host

export async function generateMetadata() {
    return siteMetadata();
}

export default async function HomePage() {
    const h = await headers();
    const site = await resolveSite(h.get("host"));
    if (!site) return <NoSite />;

    const home = (site.pages ?? []).find((p) => p.slug === "home") ?? (site.pages ?? [])[0] ?? { sections: [] };
    const data = await resolveSectionData(home.sections ?? [], { orgId: site.orgId });

    return (
        <SiteFrame site={site}>
            <SectionRenderer sections={home.sections ?? []} site={site} data={data} />
        </SiteFrame>
    );
}
