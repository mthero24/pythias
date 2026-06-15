import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import SearchView from "@/components/catalog/SearchView";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    return siteMetadata({ title: "Search" });
}

export default async function SearchPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <section style={{ padding: "40px 0" }}>
                <div className="sf-container"><SearchView /></div>
            </section>
        </SiteFrame>
    );
}
