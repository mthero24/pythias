import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order, Items as Item} from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}
export default async function Test(){

    // let orders = await Order.findOne({poNumber: "1123"})
    // //console.log(orders, "orders length")
    // let headers = {
    //     headers: {
    //         "Authorization": `Basic ${btoa(`${process.env.ssApiKey}:${process.env.ssApiSecret}`)}`
    //     }
    // }
    // let res = await axios.get(`https://ssapi.shipstation.com/orders?orderNumber=${orders.poNumber}`, headers).catch(e => { console.log(e.response.data) })
    // //console.log(res.data, "res data")
    // //console.log(res.data.orders[0].items)  
    // console.log(res.data.orders[0].items.length, "items length") 
    // for(let item of res.data.orders[0].items){
    //     console.log(item, "item")
    //     if(item.sku != ""){
    //         let i = await Item.findOne({ orderItemId: item.orderItemId })
    //         if(!i){
    //             console.log(item.sku, "item sku")
    //             let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: item.sku } }  }).populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
    //             if (!product) await Products.findOne({ variantsArray: { $elemMatch: { previousSkus: item.sku } } }).populate("design variantsArray.blank variantsArray.color")
    //             //console.log(product, "product")  
    //             if(product){
    //                 let variant = product.variantsArray.find(v => v.sku == item.sku)
    //                 if(!variant) variant = product.variantsArray.find(v => v.previousSkus && v.previousSkus.includes(item.sku))
    //                 //console.log(variant, "variant")
    //                 let i = new Item({ pieceId: await generatePieceID(), paid: true, sku: variant.sku, orderItemId: item.orderItemId, blank: variant.blank, styleCode: variant.blank.code, sizeName: variant.blank.sizes.filter(s => s._id.toString() == variant.size.toString())[0]?.name, threadColorName: variant.threadColor?.name, threadColor: variant.threadColor, colorName: variant.color?.name, color: variant.color, size: variant.blank.sizes.filter(s => s._id.toString() == variant.size.toString())[0], design: variant.threadColor? product.design.threadImages[variant.threadColor?.name]: product.design.images, designRef: product.design, order: orders._id, shippingType: orders.shippingType, quantity: 1, status: orders.status, name: item.name, date: orders.date, type: product.design.printType, options: item.options[0]?.value })
    //                 console.log(i, "item to save")
    //                 await i.save();
    //                 orders.items.push(i._id)
    //             }
    //         }
    //     }
    // }
    // await orders.save()
    return <h1>test</h1>
}