import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { TikTokAuth, ApiKeyIntegrations, OrgIntegrations, Organization } from "@pythias/mongo";
import { Main } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function buildEtsyRedirectURI() {
    const base64URLEncode = (str) =>
        str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest();
    const codeVerifier = base64URLEncode("catsaregreat");
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = Math.random().toString(36).substring(7);
    const clientId = process.env.etsyApiKey?.split(":")[0];
    const base = process.env.NEXTAUTH_URL || "";
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${base}/api/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

export default async function IntegrationsPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;

    const [tiktokShops, providerIntegrations, allShopify, creds, org] = await Promise.all([
        TikTokAuth.find({ provider: slug }).sort({ date: -1 }).lean().catch(() => []),
        ApiKeyIntegrations.find({ provider: slug }).lean().catch(() => []),
        ApiKeyIntegrations.find({ displayName: /^shopify-/ }).lean().catch(() => []),
        OrgIntegrations.findOne({ orgId: session.user.orgId }).lean().catch(() => null),
        Organization.findById(session.user.orgId).lean().catch(() => null),
    ]);

    const nonShopify = serialize(providerIntegrations).filter(
        a => a.type !== "shopify" && !a.displayName?.startsWith("shopify-")
    );
    const shopifyIntegrations = serialize(allShopify)
        .filter(a => a.provider === slug)
        .map(a => ({ ...a, type: "shopify" }));

    const apiKeyIntegrations = [...nonShopify, ...shopifyIntegrations];

    const channelEngineConnected = !!(creds?.channelengine?.apiUrl && creds?.channelengine?.apiKey);
    const gs1Connected = !!org?.settings?.gs1?.apiKey;

    return (
        <Main
            tiktokShops={serialize(tiktokShops)}
            apiKeyIntegrations={apiKeyIntegrations}
            provider={slug}
            slug={slug}
            etsyRedirectURI={buildEtsyRedirectURI()}
            shopifyAppUrl={process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com"}
            channelEngineConnected={channelEngineConnected}
            gs1Connected={gs1Connected}
        />
    );
}
