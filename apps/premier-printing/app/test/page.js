import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
import { getOrders, generatePieceID } from "@pythias/integrations";
export default async function Test(){
    // let items = await Item.find({status: "shipped"})
    // console.log(items.length)
    // for(let i of items){
    //     i.labelPrinted = true;
    //     await i.save()
    // }
    // let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    // let skusFound = 0
    // let skusNotFOund = 0
    // for(let o of orders){
    //     let order = await Order.findOne({orderId: o.orderId}).populate("items")
    //     if(!order){
    //         order = new Order({orderId: o.orderId, poNumber: o.orderNumber, orderKey: o.orderKey, date: o.orderDate, status: o.orderStatus,
    //             uniquePo: `${o.orderNumber}-${o.orderId}-${o.advancedOptions.source? o.advancedOptions.source: o.billTo.name}`,
    //             shippingAddress: {
    //                 name: o.shipTo.name,
    //                 address1: o.shipTo.street1,
    //                 address2: o.shipTo.street2,
    //                 city: o.shipTo.city,
    //                 zip: o.shipTo.postalCode,
    //                 state: o.shipTo.state,
    //                 country: o.shipTo.country
    //             },
    //             shippingType: o.carrierCode == "stamps_com"? "Standard": "Expedited",
    //             marketplace: o.orderNumber.toLowerCase().includes("cs")? "customer service entry": o.advancedOptions.source? o.advancedOptions.source: o.billTo.name,
    //             total: o.orderTotal,
    //             paid: true
    //         })
    //         let items = []
    //         for(let i of o.items){
    //             if(i.sku != ""){
    //                 let sku
    //                 if(i.upc){
    //                     sku = await SkuToUpc.findOne({upc: i.upc})
    //                 }
    //                 if(!sku) sku = await SkuToUpc.findOne({sku: i.sku})
    //                 if(!sku) skusNotFOund++
    //                 else skusFound++
    //                 for(let j = 0; j < parseInt(i.quantity); j++){
    //                     let design
    //                     let blank
    //                     let color
    //                     let size
    //                     if(sku) {
    //                         design = await Design.findOne({_id: sku.design})
    //                         blank = await Blank.findOne({_id: sku.blank})
    //                         color = await Color.findOne({_id: sku.color})
    //                         size = blank?.sizes?.filter(s=> s.name.toLowerCase() == sku.size?.toLowerCase())[0]   
    //                     }else{
    //                         blank = await Blank.findOne({code: i.sku.split("_")[0]})
    //                         color = await Color.findOne({name: i.sku.split("_")[1]})
    //                         if(!color) await Color.findOne({name: i.sku.split("_")[2]})
    //                         if(blank){
    //                             size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[2]?.toLowerCase())[0] 
    //                             if(!size) size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[1]?.toLowerCase())[0]
    //                         }
    //                         let dSku = i.sku.split("_").splice(3)
    //                         let designSku =""
    //                         for(let j = 0; j < dSku.length; j++){
    //                             if(j == 0) designSku = dSku[j]
    //                             else designSku = `${designSku}_${dSku[j]}`
    //                         }
    //                         design = await Design.findOne({sku: designSku})
    //                     }
    //                     let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name})
    //                     //console.log(item)
    //                     await item.save()
    //                     items.push(item)
    //                 }
    //             }
    //             //console.log(items)
    //         }
    //         order.items = items
    //     }else{
    //         //if(order.status != o.orderStatus){
    //             order.status = o.orderStatus
    //             if(order.status == "shipped"){
    //                 order.items.map(async i=>{
    //                     i.status = order.status;
    //                     i.labelPrinted = true;
    //                     await i.save()
    //                 })
    //             }
    //         //}
    //     }
    //     console.log(order)
    //     await order.save()
    //     //save order
    // }
    // console.log(skusFound, skusNotFOund)
    return <h1>test</h1>
}