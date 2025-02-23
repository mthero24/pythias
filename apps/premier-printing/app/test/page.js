import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import skus from "./rest.json";

export default async function Test(){
    // let designs = await Design.find({}).limit(1000)
    // let skip = 1000
    // while(designs.length > 0){
    //     for(let d of designs){
    //         if(!d.blanks) d.blanks = []
    //         let skus = await SkuToUpc.find({design: d._id})
    //         console.log(skus.length)
    //         let blanks = {}
    //         for(let sku of skus){
    //             if(!blanks[sku.blank]) blanks[sku.blank] = []
    //             if(!blanks[sku.blank].includes(sku.color)) blanks[sku.blank].push(sku.color)
    //         }
    //         console.log(blanks)
    //         for(let b of Object.keys(blanks)){
    //             if(!d.blanks.filter(db=> db.blank.toString() == b.toString )[0]){
    //                 d.blanks.push({blank: b, colors: blanks[b]})
    //             }
    //         }
    //         console.log(d.blanks)
    //         await d.save()
    //     }
    //     designs = await Design.find({}).skip(skip).limit(1000)
    //     skip+= 1000
    // }
    return <h1>test</h1>
}