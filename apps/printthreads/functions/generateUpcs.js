import Design from "@/models/Design";
import SkuToUpc from "@/models/skuUpcConversion";
import { createUpc } from "@/functions/createUpcs";
const doUPC = async ({design, blank})=>{
    let soemthing = await createUpc({design, blank})
    return soemthing
}
export async function generateUPC(){
    let designs = await Design.find({published: true}).limit(100).populate("blanks.blank blanks.colors")
    let skip = 100
    while(designs.length > 0){
        console.log("designs.length", designs.length)
        let j = 0
        for(let design of designs){
            let i = 0
            for(let b of design.blanks){
                if(b.blank){
                    let skus = await SkuToUpc.find({design: design._id, blank: b.blank._id})
                    if(skus.length < (b.colors.length * b.blank.sizes.length)) await doUPC({design, blank: b.blank._id})
                    console.log("design: ", design.sku, j, " blank: ", b.blank.code, i)     
                    i++   
                }                   
            }
            j++
        }
        designs = await Design.find({published: true}).skip(skip).limit(100).populate("blanks.blank blanks.colors")
        skip += 100
        console.log("skip: ", skip)
    }
}   