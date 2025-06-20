import {Main} from "@pythias/integrations";
import TikTokAuth from "@/models/tiktok";
import { serialize } from "@/functions/serialize";
export default async function Integrations(){
    let tiktokShops = []
    // let tiktokshops = await TikTokAuth.find({provider: "premierPrinting"})
    // let tiktokShops = serialize(tiktokshops)
    return <Main tiktokShops={tiktokShops}/>
}