import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";

// Per-site browser metadata (tab title, description, favicon) so each storefront is
// branded as the seller's, not "Pythias". Used by each page's generateMetadata().
export async function siteMetadata({ title, description } = {}) {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return { title: "Pythias Storefront" };

    const name = site.name || site.subdomain || "Store";
    const fav = site.theme?.favicon;
    const homeSeo = (site.pages ?? []).find((p) => p.slug === "home")?.seo ?? {};

    return {
        title: title ? `${title} — ${name}` : (homeSeo.title || name),
        description: description || homeSeo.description || `Shop ${name}`,
        icons: fav ? { icon: fav } : undefined,
        openGraph: { title: title ? `${title} — ${name}` : name, images: homeSeo.ogImage ? [homeSeo.ogImage] : undefined },
    };
}
