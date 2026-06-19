import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";

// Per-site browser + SOCIAL metadata (tab title, description, favicon, OpenGraph + Twitter cards,
// canonical) so each storefront is branded as the seller's and shares richly on Facebook/X/iMessage/etc.
// Used by each page's generateMetadata(). `image` overrides the share image (e.g. a page's OG image),
// `path` sets the canonical/og:url for the current page.
export async function siteMetadata({ title, description, image, path } = {}) {
    const host = (await headers()).get("host");
    const site = await resolveSite(host);
    if (!site) return { title: "Pythias Storefront" };

    const name = site.name || site.subdomain || "Store";
    const fav = site.theme?.favicon;
    const homeSeo = (site.pages ?? []).find((p) => p.slug === "home")?.seo ?? {};

    const fullTitle = title ? `${title} — ${name}` : (homeSeo.title || name);
    const desc = description || homeSeo.description || `Shop ${name}`;
    const ogImage = image || homeSeo.ogImage || site.theme?.logoUrl;
    const images = ogImage ? [ogImage] : undefined;
    const origin = host ? `https://${host}` : undefined;
    const url = origin ? `${origin}${path || ""}` : undefined;

    return {
        title: fullTitle,
        description: desc,
        icons: fav ? { icon: fav } : undefined,
        ...(url ? { alternates: { canonical: url } } : {}),
        openGraph: {
            title: fullTitle, description: desc, type: "website", siteName: name,
            ...(url ? { url } : {}),
            ...(images ? { images } : {}),
        },
        twitter: {
            card: images ? "summary_large_image" : "summary",
            title: fullTitle, description: desc,
            ...(images ? { images } : {}),
        },
    };
}
