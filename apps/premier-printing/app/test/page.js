import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import skus from "./rest.json";

export default async function Test(){
    // let i = 0
    // let colors = await Color.find({}).lean()
    // let upctosku = []
    // for( let s of skus){
    //     try{
    //         let skuArr = s.split("_")
    //         console.log(skuArr)
    //         let blank = skuArr[0]
    //         let color = skuArr[1]
    //         let size = skuArr[2]
    //         let sku = skuArr.splice(3)
    //         //console.log(sku)
    //         let newSku = ""
    //         for( let part of sku){
    //             newSku = `${newSku}_${part}`
    //         }
    //         newSku = newSku.replace("_", "")
    //         console.log(newSku, blank, color, size)
    //         let skuToUpc = new SkuToUpc({sku: s})
    //         skuToUpc.blank = await Blank.findOne({code: blank}).select("_id sizes").lean()
    //         skuToUpc.design = await Design.findOne({sku: newSku}).select("_id").lean()
    //         skuToUpc.size = size;
    //         skuToUpc.color = null
    //         skuToUpc.upc = i;
    //         if(color){
    //             for(let c of colors) {
    //                 //console.log(c.name.replace(/\./g, '').replace(/ /g, ""), color.replace(/\./g, '').replace(/ /g, ""))
    //                 if(c.name.toLowerCase().replace(/\./g, '').replace(/ /g, "") == color.toLowerCase().replace(/\./g, '').replace(/ /g, "")){
    //                     skuToUpc.color = c._id
    //                 }
    //             }
    //         }
    //         i++
    //         skuToUpc = await skuToUpc.save()
    //         console.log(skuToUpc)
    //     }catch(e){
    //         console.log(e)
    //     }
    // }
    return <h1>test</h1>
}