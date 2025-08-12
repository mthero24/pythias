import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order, Items, ProductInventory } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}
const createItem = async ({ i, order, design, blank, size, color, threadColor, sku }) => {
    if (!size) console.log("no size", blank.code, color?.name, color?.sku, design.sku)
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: sku,
        orderItemId: i.orderItemId,
        blank: blank,
        styleCode: blank.code,
        sizeName: size?.name,
        threadColorName: threadColor?.name,
        threadColor: threadColor,
        colorName: color?.name,
        color: color,
        size: size,
        design: design.threadColor ? design.threadImages[threadColor?.name] : design.images,
        designRef: design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: 1,
        status: order.status,
        name: i.name,
        date: order.date,
        type: design.printType,
        options: i.options[0]?.value
    })
    if (order.status == "cancelled") {
        item.canceled = true
    }
    let productInventory = await ProductInventory.findOne({ sku: i.sku })
    if (productInventory) {
        if (productInventory.quantity > 0) {
            item.inventory = { type: "productInventory", ProductInventory: productInventory._id }
            productInventory.quantity -= 1
            await productInventory.save()
        }

    } else {
        let inventory = await Inventory.findOne({ blank: blank._id, color: color ? color._id : null, sizeId: size?._id ? size._id.toString() : size?.toString() })
        if (inventory) {
            if (inventory.quantity > 0) {
                inventory.quantity -= 1
                await inventory.save()
                item.inventory = { type: "inventory", Inventory: inventory._id }
            } else {
                if (!inventory.attached) inventory.attached = []
                inventory.attached.push(item._id)
                await inventory.save()
            }
        }
    }
    await item.save();
    return item;
}
export default async function Test(){
    console.log("Test Page")
    //await pullOrders("577070468438331861")
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: "577069177370219456" })
    console.log(orders.length, "orders", orders[0])
   
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