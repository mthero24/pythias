import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order, Items, ProductInventory } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}
export default async function Test(){
    console.log("Test Page")
    //await pullOrders("577070468438331861")
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: "577070468438331861" })
    console.log(orders.length, "orders")
    for(let o of orders){
        for(let i of o.items){
            if(i.name && i.name.toLowerCase() != "seller discount" && i.name.toLowerCase() != "platform discount"){
               
                console.log(i.sku, "item sku")
                let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: i.sku } } }).populate("design variantsArray.blank variantsArray.color variantsArray.threadColor").populate("blanks colors threadColors design")
                console.log(product, "product")
                if(product){
                    let variant = product.variantsArray.filter(v => v.sku == i.sku)[0];
                    if(variant){
                        console.log(variant, "variant")
                        let item = await CreateSku({ blank: variant.blank, color: variant.color, size: variant.blank.sizes.filter(s => s._id.toString() == variant.size.toString())[0], design: product.design, threadColor: variant.threadColor });
                        console.log(item, "item created")
                    }else{
                        console.log("no variant found for sku", i.sku)
                    }
                }
            }
        }
    }
    // let items = await Items.find({name: {$in: ["Seller discount", "Platform discount"]} }).populate("order").sort({ _id: -1 })
    // console.log(items.length, "items")
    // for(let item of items){
    //     item.order.items = item.order.items.filter(i => i._id.toString() != item._id.toString())
    //     await item.order.save()
    //     await Items.findByIdAndDelete(item._id)
    //     console.log(item._id.toString(), "deleted")
    // }
    // console.log(items.length, "items to update")
    // for(let item of items){
    //     //console.log(item.threadColor, item.designRef.threadImages)
    //     if(item.designRef.threadImages){
    //         item.design = item.designRef.threadImages[item.threadColor.name];
    //     }else{
    //         item.design = item.designRef.images
    //     }
    //     await item.save()
    // }
    //  let orders = await Order.find({items: {$size: 0}}).sort({_id: -1}).limit(100)
    // for(let order of orders){
    //     console.log(order._id.toString())
    //     let items = await Items.find({order: order._id})
    //     if(items.length > 0) {
    //         order.items = items
    //         await order.save()
    //     }else{
    //         await Order.findByIdAndDelete(order._id)
    //         console.log("deleted")
    //     }
    //     console.log(items.length, "items")
    //     //await order.save()
    // }
    return <h1>test</h1>
}