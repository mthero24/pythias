import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import FavoritesView from "@/components/favorites/FavoritesView";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    return siteMetadata({ title: "Favorites" });
}

export default async function FavoritesPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <FavoritesView />
        </SiteFrame>
    );
}
