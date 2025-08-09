import { Main } from "@pythias/integrations";
import { TikTokAuth, ApiKeyIntegrations } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { generateRedirectURI } from "@pythias/integrations";
export const dynamic = 'force-dynamic';
export default async function Integrations() {
    let tiktokShops = await TikTokAuth.find({ provider: "imperial" })
    let apiKeyIntegrations = await ApiKeyIntegrations.find({ provider: "imperial" })
    console.log(tiktokShops)
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = serialize(apiKeyIntegrations)
    // Generate the redirect URI for Etsy integration
    const etsyRedirectURI = generateRedirectURI("https://imperial.pythiastechnologies.com");
    console.log("Etsy Redirect URI:", etsyRedirectURI);
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"imperial"} etsyRedirectURI={etsyRedirectURI} />
}