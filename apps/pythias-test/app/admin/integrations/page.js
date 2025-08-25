import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { generateRedirectURI } from "@pythias/integrations";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({provider: "pythias-test"})
    let apiKeyIntegrations = await ApiKeyIntegrations.find({provider: "pythias-test"})
    console.log(tiktokShops)
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = serialize(apiKeyIntegrations)
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"pythias-test"} source={"http://localhost:3007"}/>
}