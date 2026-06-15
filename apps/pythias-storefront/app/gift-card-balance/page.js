import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import GiftCardBalance from "@/components/GiftCardBalance";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return siteMetadata({ title: "Gift card balance" }); }

export default async function GiftCardBalancePage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    return (
        <SiteFrame site={site}>
            <section style={{ padding: "56px 0" }}>
                <div className="sf-container" style={{ maxWidth: 440 }}>
                    <h1 style={{ marginBottom: 16 }}>Check gift card balance</h1>
                    <GiftCardBalance />
                </div>
            </section>
        </SiteFrame>
    );
}
