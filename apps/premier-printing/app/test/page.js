import { getOrders, processOrders } from "@/functions/tikTok";
import TikTokAuth from "@/models/tiktok";
import { getSkuAcenda } from "@pythias/integrations";
export default async function Test(){
    let credentials = { clientId: process.env.acendaClientIdSS, clientSecret: process.env.acendaClientSecretSS, organization: process.env.acendaOrganizationSS }
    // let auths = await TikTokAuth.find({provider: "premierPrinting"})
    // //console.log(auths);
    // let orders = await getOrders(auths)
    // processOrders(orders)
    let item = await getSkuAcenda({
        ...credentials, sku: "GDT_Pepper_S_7091M_F" })
    console.log(item[0].group_skus[0])
    let product = await getSkuAcenda({
        ...credentials, sku: item[0].group_skus[0]
    })
    console.log(product)
    return <h1>test</h1>
}