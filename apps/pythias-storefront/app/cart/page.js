import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import CartView from "@/components/cart/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <CartView />
        </SiteFrame>
    );
}
