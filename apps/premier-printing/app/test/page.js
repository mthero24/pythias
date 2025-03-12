import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
import axios from "axios"
import btoa from "btoa"
import {getToken} from "@pythias/integrations"
export default async function Test(){
    // let design = await Design.findOne({cleaned: {$in: [false, null]}, sku: {$regex: "_F", $options: "xi"}}) 
    // console.log(design.sku)
    // let designSku = design.sku.split("_")[0]
    // let designs = await Design.find({_id: {$ne: design._id},sku: {$regex: designSku, $options: "xi"}})
    // for(let d of designs){
    //     let sku = d.sku.split("_")[0]
    //     console.log(sku, d.sku, design.sku)
    //     if(sku == designSku) console.log(true)
    //     else console.log(false)
    // }
    // console.log(designSku, designs.length)
    console.log( process.env.jsMiraklClientSecret, process.env.jsMiraklClientSecret, process.env.jsMiraklSellerCompanyId, "page")
    let token = await getToken({clientId: process.env.jsMiraklClientId, clientSecret: process.env.jsMiraklClientSecret, companyId: process.env.jsMiraklSellerCompanyId})
    console.log(token)
    return <h1>test</h1>
}