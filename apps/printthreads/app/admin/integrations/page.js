import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { generateRedirectURI } from "@pythias/integrations";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({provider: "printthreads"})
    let apiKeyIntegrations = await ApiKeyIntegrations.find({provider: "printthreads"})
    console.log(tiktokShops)
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = serialize(apiKeyIntegrations)
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"printthreads"} source={"http://localhost:3009"}/>
}