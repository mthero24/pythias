import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { generateRedirectURI } from "@pythias/integrations";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({ provider: "printthreads" }).sort({ date: -1 }).catch(e => { console.log(e); }) || []
    const [providerIntegrations, allShopify] = await Promise.all([
        ApiKeyIntegrations.find({ provider: "printthreads" }).lean(),
        ApiKeyIntegrations.find({ displayName: /^shopify-/ }).lean(),
    ]);
    tiktokShops = serialize(tiktokShops);

    const nonShopify = serialize(providerIntegrations).filter(
        a => a.type !== "shopify" && !a.displayName?.startsWith("shopify-")
    );
    const shopifyIntegrations = serialize(allShopify)
        .filter(a =>
            a.provider === "printthreads" ||
            a.provider === "Print Threads" ||
            !a.provider ||
            a.provider === "pythias-test" ||
            a.provider === "pythias test"
        )
        .map(a => ({ ...a, type: "shopify" }));

    const apiKeyIntegrations = [...nonShopify, ...shopifyIntegrations];

    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"printthreads"} source={"http://localhost:3009"} shopifyAppUrl={process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com"}/>
}