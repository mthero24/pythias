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
    pullOrders()
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
    // let headers = {
    //     headers: {
    //         Authorization: `Basic ${btoa(`${process.env.ssApiKey}:${process.env.ssApiSecret}`)}`
    //     }
    // }
    // let order = await Order.findOne({poNumber: "54336"})
    // console.log(order.poNumber, order.orderId)
    // let res = await axios.get(`https://ssapi.shipstation.com/orders/${order.orderId}`, headers).catch(e=>{console.log(e.response.data)})
    // console.log(res?.data)
    // console.log(res.data.customerNotes)
    // if(res.data.customerNotes){
    //     console.log(res.data.customerNotes.split("<br/>"))
    //     let notesObj = {}
    //     res.data.customerNotes.split("<br/>").map(b=>{
    //         let sp = b.split(":")
    //         notesObj[sp[0].toLowerCase().replace(/ /g, "_").trim()] = sp[1].trim()
    //     })
    //     console.log(notesObj)
    //     if(notesObj.order_placed_from == "Kohl's"){
    //         order.marketplace = "kohls"
    //         order.kohlsId= notesObj.order_id
    //     } 
    //     console.log(order.poNumber, order.marketplace)        
    // }
    // // console.log( process.env.jsMiraklClientSecret, process.env.jsMiraklClientSecret, process.env.jsMiraklSellerCompanyId, "page")
    // let res2 = await getOrderKohls({clientId: process.env.jsMiraklClientId, clientSecret: process.env.jsMiraklClientSecret, companyId: process.env.jsMiraklSellerCompanyId})
    //console.log(token)
    return <h1>test</h1>
}