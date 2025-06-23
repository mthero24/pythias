import {Main} from "@pythias/integrations";
import TikTokAuth from "@/models/tiktok";
import { serialize } from "@/functions/serialize";
export const dynamic = 'force-dynamic';
export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({provider: "premierPrinting"})
    console.log(tiktokShops)
    tiktokShops = serialize(tiktokShops)
    return <Main tiktokShops={tiktokShops} provider={"premierPrinting"}/>
}