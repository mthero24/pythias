import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import skus from "./rest.json";
import { getOrders } from "@pythias/integrations";
export default async function Test(){
    // let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    // let skusFound = 0
    // let skusNotFOund = 0
    // for(let o of orders){
    //     for(let i of o.items){
    //         let sku = await SkuToUpc.findOne({sku: i.sku})
    //         if(!sku) skusNotFOund++
    //         else skusFound++
    //     }
    // }
    // console.log("found: ", skusFound, "Not Found: ", skusNotFOund)
    let skusNotFound = 0
    let skusFound = 0
    for(let s of skus){
        let sku = await SkuToUpc.findOne({sku: s.sku})
        if(sku){
            sku.upc = s.upc
            skusFound++
            await sku.save()
        }else{
            let sku = new SkuToUpc({...s})
            await sku.save()
            skusNotFound++
            console.log(s.sku)
            console.log("no sku: ", skusNotFound, "skusFound: ",skusFound)
        }
    }
    console.log("no sku: ", skusNotFound, "skusFound: ",skusFound)
    return <h1>test</h1>
}