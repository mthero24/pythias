import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import CheckoutView from "@/components/checkout/CheckoutView";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <CheckoutView storeName={site.businessInfo?.legalName || site.name} badges={site.footer?.badges || []} />
        </SiteFrame>
    );
}
