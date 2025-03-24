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
import {gtins} from "@/functions/gtin";
export default async function Test(){
    let headers = {
        headers:{
            "Cache-Control": "no-cache",
            ApiKey: process.env.gs1PrimaryProductKey,
            "X-Product-Owner-Account-Id": process.env.gs1AccountNumber
        }
    }
    console.log(gtins[1])
    let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${gtins[4]}`, headers).catch(e=> console.log(e.response?.data))
    console.log(res.data)
    let sizes = {small: "S", medium: "M", large: "L", ym: "M", ys: "S", yl: "L", yxs: "XS", yxl: "XL"}
    if(res.data?.sku){
        let skuToUpc = await SkuToUpc.findOne({sku: res.data.sku})
        if(skuToUpc){
            console.log(skuToUpc, "last")
            skuToUpc.upc = res.data.gtin.replace("00", "");
            skuToUpc.gtin = res.data.gtin;
            skuToUpc.size= sizes[res.data.sku.split("_")[2]?.toLowerCase()]? sizes[res.data.sku.split("_")[2]?.toLowerCase()]: res.data.sku.split("_")[2]
            skuToUpc.color= await Color.findOne({name: res.data.sku.split("_")[1]}) 
            await skuToUpc.save()
            console.log(skuToUpc)
        }else{
            skuToUpc = new SkuToUpc({
                sku: res.data.sku,
                upc: res.data.gtin.replace("00", ""),
                size: sizes[res.data.sku.split("_")[2]?.toLowerCase()]? sizes[res.data.sku.split("_")[2]?.toLowerCase()]: res.data.sku.split("_")[2],
                color: await Color.findOne({name: res.data.sku.split("_")[3]}),
                gtin: res.data.gtin
            })
            await skuToUpc.save()
        }
    }else{
        let skuToUpc = await SkuToUpc.findOne({upc: res.data.gtin.replace("00", "")})
        if(skuToUpc){
            console.log(skuToUpc, "last")
            skuToUpc.upc = res.data.gtin.replace("00", "");
            skuToUpc.gtin = res.data.gtin;
            await skuToUpc.save()
            console.log(skuToUpc)
        }else{
            skuToUpc = new SkuToUpc({
                sku: res.data.sku,
                upc: res.data.gtin.replace("00", ""),
                gtin: res.data.gtin
            })
            await skuToUpc.save()
        }
    }
    return <h1>test</h1>
}