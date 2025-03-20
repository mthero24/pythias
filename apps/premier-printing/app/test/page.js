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
import {getOrderKohls} from "@pythias/integrations"
import {pullOrders} from "@/functions/pullOrders";
export default async function Test(){
    // let skuToUpc = await SkuToUpc.find({}).limit(1)
    // console.log(skuToUpc)
    // let upc = skuToUpc[0]
    // let sku2 = await SkuToUpc.find({_id: {$ne: upc._id},design: upc.design, blank: upc.blank})
    // console.log(sku2.length)
    // let headers = {
    //     headers:{
    //         "Cache-Control": "no-cache",
    //         ApiKey: process.env.gs1PrimaryProductKey,
    //         "X-Product-Owner-Account-Id": process.env.gs1AccountNumber
    //     }
    // }
    // let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/00196817302496`, headers).catch(e=> console.log(e.response.data))
    // console.log(res.data)
    // if(res.data.sku){
    //     skuToUpc = await SkuToUpc.findOne({sku: res.data.sku})
    //     if(skuToUpc){
    //         console.log(skuToUpc, "last")
    //         skuToUpc.upc = res.data.gtin.replace("00", "");
    //         skuToUpc.gtin = res.data.gtin;
    //         await skuToUpc.save()
    //         console.log(skuToUpc)
    //     }else{
    //         skuToUpc = new SkuToUpc({
    //             sku: res.data.sku,
    //             upc: res.data.gtin.replace("00", ""),
    //             gtin: res.data.gtin
    //         })
    //         await skuToUpc.save()
    //     }
    // }
    return <h1>test</h1>
}