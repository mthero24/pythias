import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations, ShopifyUserData} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { generateRedirectURI } from "@pythias/integrations";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({ provider: "printthreads" }).sort({ date: -1 }).catch(e => { console.log(e); }) || []
    let apiKeyIntegrations = await ApiKeyIntegrations.find({provider: "printthreads"})
    const shopifyConnections = await ShopifyUserData.find({ provider: "Print Threads" }).catch(() => [])
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = [
        ...serialize(apiKeyIntegrations),
        ...serialize(shopifyConnections).map(s => ({
            _id: s._id, displayName: `shopify-${s.shop}`, type: "shopify",
            apiKey: s.pythiasToken, pullOrdersEnabled: s.autoImportOrders,
        })),
    ]
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"printthreads"} source={"http://localhost:3009"} shopifyAppUrl={process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com"}/>
}