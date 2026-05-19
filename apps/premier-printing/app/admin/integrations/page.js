import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations, ShopifyUserData} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import crypto from "crypto";
export const dynamic = 'force-dynamic';

function buildEtsyRedirectURI() {
    const base64URLEncode = (str) =>
        str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest();
    const codeVerifier = base64URLEncode("catsaregreat");
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = Math.random().toString(36).substring(7);
    const clientId = process.env.etsyApiKey?.split(":")[0];
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${process.env.NEXTAUTH_URL || ""}/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({ provider: "premierPrinting" }).catch(e => { console.log(e) }) || []
    let apiKeyIntegrations = await ApiKeyIntegrations.find({
        $or: [
            { provider: "premierPrinting" },
            { provider: null },
            { displayName: /^shopify-/ },
        ]
    })
    const shopifyConnections = await ShopifyUserData.find({ provider: "Premier Printing" }).catch(() => [])
    tiktokShops = serialize(tiktokShops)

    // Normalize: ensure ApiKeyIntegrations shopify entries have type set
    const serializedApiKeys = serialize(apiKeyIntegrations).map(a => {
        if (!a.type && a.displayName?.startsWith("shopify-")) return { ...a, type: "shopify" };
        return a;
    });

    // Add any ShopifyUserData entries not already covered by ApiKeyIntegrations
    const coveredShops = new Set(serializedApiKeys.filter(a => a.type === "shopify").map(a => a.displayName));
    const extraShopify = serialize(shopifyConnections)
        .filter(s => !coveredShops.has(`shopify-${s.shop}`))
        .map(s => ({
            _id: s._id, displayName: `shopify-${s.shop}`, type: "shopify",
            apiKey: s.pythiasToken, pullOrdersEnabled: s.autoImportOrders,
        }));

    apiKeyIntegrations = [...serializedApiKeys, ...extraShopify];

    const etsyRedirectURI = buildEtsyRedirectURI()
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"premierPrinting"} etsyRedirectURI={etsyRedirectURI} shopifyAppUrl={process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com"}/>
}