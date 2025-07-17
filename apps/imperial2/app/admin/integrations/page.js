import {Main} from "@pythias/integrations";
import {TikTokAuth} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
export default async function Integrations(){
    let tiktokShops =[]
    //let tiktokshops = await TikTokAuth.find({provider: "premierPrinting"})
    //tiktokShops = serialize(tiktokshops)
    return <Main tiktokShops={tiktokShops}/>
}