import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { Organization, OrgIntegrations } from "@pythias/mongo";
import { PlatformIntegrationsPage } from "@/components/PlatformIntegrationsPage";

export const dynamic = "force-dynamic";

const CRED_CHECKS = {
    shopify:     (c) => !!c?.shopify?.accessToken,
    tiktok:      (c) => !!c?.tiktok?.accessToken,
    etsy:        (c) => !!c?.etsy?.accessToken,
    walmart:     (c) => !!c?.walmart?.clientId,
    amazon:      (c) => !!c?.amazon?.refreshToken,
    ebay:        (c) => !!c?.ebay?.accessToken,
    faire:       (c) => !!c?.faire?.applicationId,
    acenda:      (c) => !!c?.acenda?.clientId,
    mirakl:      (c) => !!c?.mirakl?.apiKey,
    shein:       (c) => false,
    temu:        (c) => false,
    noon:        (c) => false,
    bol:         (c) => false,
    wix:         (c) => false,
    woocommerce: (c) => false,
    squarespace: (c) => false,
    meta:        (c) => false,
    pinterest:   (c) => false,
    onbuy:       (c) => false,
    rakuten:     (c) => false,
    wayfair:     (c) => false,
    rithum:      (c) => false,
    target:      (c) => false,
};

export default async function IntegrationsPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const [org, creds] = await Promise.all([
        Organization.findById(session.user.orgId).lean(),
        OrgIntegrations.findOne({ orgId: session.user.orgId }).lean(),
    ]);
    if (!org) redirect("/login");

    const connectedTypes = Object.entries(CRED_CHECKS)
        .filter(([, check]) => check(creds))
        .map(([type]) => type);

    const channelEngineConnected = !!(creds?.channelengine?.apiUrl && creds?.channelengine?.apiKey);

    const { slug } = await params;

    return (
        <PlatformIntegrationsPage
            connectedTypes={connectedTypes}
            channelEngineConnected={channelEngineConnected}
            slug={slug}
        />
    );
}
