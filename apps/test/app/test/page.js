import { getOrders, processOrders } from "@/functions/tikTok";
import TikTokAuth from "@/models/tiktok";

export default async function Test(){
    let auths = await TikTokAuth.find({provider: "test"})
    //console.log(auths);
    let orders = await getOrders(auths)
    processOrders(orders)
    return <h1>test</h1>
}