import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { previewAllowed, withDraft } from "@/lib/preview";
import { systemPageSections } from "@/lib/systemSections";
import { SiteFrame, SectionRenderer } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import CartView from "@/components/cart/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }) {
    const preview = previewAllowed(await searchParams);
    const live = await resolveSite((await headers()).get("host"));
    if (!live) return <NoSite />;
    const site = withDraft(live, preview);
    const { sections, data } = await systemPageSections(site, "cart");
    return (
        <SiteFrame site={site}>
            <CartView />
            <SectionRenderer sections={sections} site={site} data={data} />
        </SiteFrame>
    );
}
