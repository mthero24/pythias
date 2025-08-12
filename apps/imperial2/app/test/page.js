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
    // let items = await Items.find({threadColor: {$ne: null}}).populate("threadColor designRef").sort({date: -1}).skip(500).limit(500)
    // for(let i of items){
    //     console.log(i.pieceId)
    //     if(i.designRef.threadImages){
    //         i.design = i.designRef.threadImages[i.threadColor.name];
    //     }else{
    //         i.design = i.designRef.images
    //     }
    //     await i.save()
    // }
    return <h1>test</h1>
}