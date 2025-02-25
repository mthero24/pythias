import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
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
    //let colors = await Color.find({}).lean()
    let skus = await SkuToUpc.find({blank: null})
    //console.log(skus)
    let sizes = ["Small", "Large", "Medium", "XSmall", "XLarge", "2XLarge", "XS", "S", "L", "M", "XL", "2XL"]
    let notOnList = []
    for(let s of skus){
        console.log(s)
        if(s.sku.split("_")[0] == "TWST"){
            s.blank = await Blank.findOne({code: "TSWT"})
            await s.save()
        } 
        if(s.sku.split("_")[0] == "CT") {
            s.blank = await Blank.findOne({code: "CT"})
            await s.save()
        }
        if(s.sku.split("_")[0] == "PC") {
            s.blank = await Blank.findOne({code: "PC"})
            await s.save()
        }
        else if(s.sku == "" || s.sku.split("_")[0] == "LS" || s.sku.split("_")[0] == "O"|| s.sku.split("_")[0] == "MUG" || s.sku.split("_")[0] == "BCSWT"|| s.sku.split("_")[0] == "HAT" || s.sku.split("_")[0] == "V" || s.sku.split("_")[0] == "TT"){
            try{
                await SkuToUpc.findOneAndDelete({_id: s._id})
            }catch(e){
                console.log(e)
            }
        }
        // if(sizes.includes(s.sku.split("_")[1])){
        //     s.size = s.sku.split("_")[1]
        //     s.color = colors.filter(c=> s.sku.split("_")[2].replace(/\./g, "").replace(/ /g, "").toLowerCase() == c.name.replace(/\./g, "").replace(/ /g, "").toLowerCase())[0]//await Color.findOne({name: s.sku.split("_")[1]})
        // }else{
        //     s.color = colors.filter(c=> s.sku.split("_")[1].replace(/\./g, "").replace(/ /g, "").toLowerCase() == c.name.replace(/\./g, "").replace(/ /g, "").toLowerCase())[0]//await Color.findOne({name: s.sku.split("_")[1]})
        //     s.size = s.sku.split("_")[2]
        // }
        // let dSku = s.sku.split("_").slice(3)
        // //console.log(dSku)
        // if(dSku[0] && dSku[0] !== "" && dSku[0] !== "White" && dSku[0] != "Natural" &&  !dSku[0]?.includes(" ")){
        //     let d_sku = ''
        //     console.log(dSku[0])
        //     let design = await Design.findOne({sku: dSku[0]})
        //     if(!design) await Design.findOne({sku: dSku[0] + "_F"})
        //     if(!design) {
        //         design = new Design({name: `Some Title ${Date.now()}`, sku: dSku[0]})
        //         design = await design.save()
        //     }
        //     console.log(design)
        //     s.design = design
        //     await s.save()
        //     // for(let i = 0; i < dSku.length; i++){
        //     //     console.log(dSku[i])
        //     //     let title = t2n.filter(t=> t.title == dSku[i].replace(" font And Back", ""))[0]
        //     //     if(title) console.log(title)
                
        //     // }
        //     // console.log(d_sku)
        //     // s.design = await Design.findOne({sku: d_sku})
        //     // await s.save()
        // }
        // console.log(s)
    }
    // console.log(notOnList)
    // await fs.writeFile("./notOnList.txt", JSON.stringify(notOnList), (err)=>{
    //     if(err) console.log(err)
    // })
    // console.log(notOnList.length)
    return <h1>test</h1>
}