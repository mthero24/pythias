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
    let colors = await Color.find({}).lean()
    let skus = await SkuToUpc.find({blank: null})
    console.log(skus)
    let sizes = ["Small", "Large", "Medium", "XSmall", "XLarge", "2XLarge", "XS", "S", "L", "M", "XL", "2XL"]
    for(let s of skus){
        console.log(s)
        s.blank = await Blank.findOne({code: s.sku.split("_")[0].replace(/Crew/g, "C")})
        if(sizes.includes(s.sku.split("_")[1])){
            s.size = s.sku.split("_")[1]
            s.color = colors.filter(c=> s.sku.split("_")[2].replace(/\./g, "").replace(/ /g, "").toLowerCase() == c.name.replace(/\./g, "").replace(/ /g, "").toLowerCase())[0]//await Color.findOne({name: s.sku.split("_")[1]})
        }else{
            s.color = colors.filter(c=> s.sku.split("_")[1].replace(/\./g, "").replace(/ /g, "").toLowerCase() == c.name.replace(/\./g, "").replace(/ /g, "").toLowerCase())[0]//await Color.findOne({name: s.sku.split("_")[1]})
            s.size = s.sku.split("_")[2]
        }
        let dSku = s.sku.split("_").slice(3)
        //console.log(dSku)
        let d_sku = ''
        for(let i = 0; i < dSku.length; i++){
            if(i == 0) d_sku = d_sku + dSku[i]
            else d_sku = `${d_sku}_${dSku[i]}`
        }
        //console.log(d_sku)
        s.design = await Design.findOne({sku: d_sku})
        console.log(s)
        await s.save()
    }
    return <h1>test</h1>
}