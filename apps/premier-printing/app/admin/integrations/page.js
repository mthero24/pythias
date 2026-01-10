import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({ provider: "premierPrinting" }).catch(e => { console.log(e) }) || []
    let apiKeyIntegrations = await ApiKeyIntegrations.find()
    console.log(apiKeyIntegrations)
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = serialize(apiKeyIntegrations)
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"premierPrinting"}/>
}