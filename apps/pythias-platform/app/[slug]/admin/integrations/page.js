import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { TikTokAuth, ApiKeyIntegrations, OrgIntegrations, Organization, ShopifyUserData } from "@pythias/mongo";
import { Main } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import crypto from "crypto";
export const dynamic = "force-dynamic";

function buildEtsyRedirectURI(orgId) {
    const base64URLEncode = (str) =>
        str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest();
    const codeVerifier = base64URLEncode("catsaregreat");
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = orgId ? orgId.toString() : Math.random().toString(36).substring(7);
    const clientId = process.env.etsyApiKey?.split(":")[0];
    const base = process.env.ETSY_REDIRECT_BASE || process.env.NEXTAUTH_URL || "";
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${base}/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

export default async function AdminIntegrationsPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const orgId = session.user.orgId;

    const [tiktokShops, providerIntegrations, orgShopify, shopifyUserData, creds, org] = await Promise.all([
        TikTokAuth.find({ $or: [{ orgId }, { provider: slug, orgId: null }] }).sort({ date: -1 }).lean().catch(() => []),
        ApiKeyIntegrations.find({ $or: [{ orgId }, { provider: slug, orgId: null }] }).lean().catch(() => []),
        ApiKeyIntegrations.find({ displayName: /^shopify-/, $or: [{ orgId }, { provider: slug, orgId: null }] }).lean().catch(() => []),
        ShopifyUserData.find({ provider: slug }).lean().catch(() => []),
        OrgIntegrations.findOne({ orgId }).lean().catch(() => null),
        Organization.findById(orgId).lean().catch(() => null),
    ]);

    const nonShopify = serialize(providerIntegrations).filter(
        a => a.type !== "shopify" && !a.displayName?.startsWith("shopify-")
    );
    const apiShopifyShops = new Set(serialize(orgShopify).map(a => a.displayName?.replace(/^shopify-/, "")));
    const shopifyIntegrations = [
        ...serialize(orgShopify).map(a => ({ ...a, type: "shopify" })),
        ...serialize(shopifyUserData)
            .filter(s => !apiShopifyShops.has(s.shop))
            .map(s => ({ _id: s._id, displayName: `shopify-${s.shop}`, type: "shopify", provider: slug })),
    ];

    const apiKeyIntegrations = [...nonShopify, ...shopifyIntegrations];

    const channelEngineConnected = !!(creds?.channelengine?.apiUrl && creds?.channelengine?.apiKey);
    const gs1Connected           = !!org?.settings?.gs1?.apiKey;
    const isFulfillment          = org?.orgType !== "commerce"; // default to fulfillment
    const showPartnerApi         = true; // Partner API available to all platform orgs (Commerce + Fulfillment Cloud)

    return (
        <Main
            tiktokShops={serialize(tiktokShops)}
            apiKeyIntegrations={apiKeyIntegrations}
            provider={slug}
            slug={slug}
            orgId={orgId}
            etsyRedirectURI={buildEtsyRedirectURI(orgId)}
            shopifyAppUrl={process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com"}
            channelEngineConnected={channelEngineConnected}
            gs1Connected={gs1Connected}
            showSupplierIntegrations={isFulfillment}
            showPartnerApi={showPartnerApi}
        />
    );
}
