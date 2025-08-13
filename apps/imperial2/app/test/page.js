import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order, Items, ProductInventory, Blank, Design, Color, Item } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
import { isSingleItem } from "@/functions/itemFunctions";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}
let sizeFixer = {
    "One Size Fits All": "OSFA",
    "One Size Fits Most": "OSFM",
    "XSmall": "XS",
    "Large": "L",
    "Small": "S",
    "Medium": "M",
    "X-Large": "XL",
    "XL": "X-Large",
    "M": "Medium",
    "S": "Small",
    "L": "Large",
    "X-Small": "XS",
    "Youth Medium": "M",
    "Youth Small": "S",
    "Youth Large": "L",
    "Youth XLarge": "XL",

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
    // let items = await Items.find({
    //     blank: { $ne: null },
    //     colorName: { $ne: null },
    //     sizeName: { $ne: null },
    //     designRef: { $ne: null },
    //     design: { $ne: null },
    //     labelPrinted: false,
    //     canceled: false,
    //     paid: true,
    //     order: { $ne: null }
    // }).populate("inventory.inventory inventory.productInventory").populate("order", "poNumber items marketplace date").lean()
    // console.log(items.length, "items to print")
    // for(let item of items){
    //     if(item.inventory && item.inventory.inventoryType == "inventory" && item.inventory.inventory){
    //         let inventory = await Inventory.findById(item.inventory.inventory)
    //         if(inventory){
    //            if(inventory.quantity - inventory.onhold > 0){
    //                inventory.onhold += 1
    //                await inventory.save()
    //            }else{
    //                 console.log("inventory onhold exceeds quantity")
    //                 if(!inventory.attached) inventory.attached = []
    //                 if(!inventory.attached.includes(item._id)) {
    //                     inventory.attached.push(item._id)
    //                     inventory.onhold += 1
    //                 }
    //                 await inventory.save()
    //            }
    //         }
    //     }
    // }
    // let items = await Items.find({ pieceId: "FM9VUB3XR" }).sort({ _id: -1 })
    // console.log(items.length, "items without inventory")
    // for (let item of items) {
    //     console.log(item.inventory, "item inventory")
    //     if (!item.inventory || !item.inventory.inventory) {
    //         let productInventory = await ProductInventory.findOne({ sku: item.sku })
    //         if (productInventory && productInventory.quantity > productInventory.onhold) {
    //             if (productInventory.quantity > productInventory.quantity - productInventory.onhold) {
    //                 item.inventory = { type: "productInventory", productInventory: productInventory._id }
    //                 productInventory.onhold += 1
    //                 await productInventory.save()
    //             }
    //         } else {
    //             let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
    //             console.log(item.blank, item.color, item.size, "item details")
    //             console.log(inventory, "inventory quantity for item",)
    //             if (inventory) {
    //                 if (inventory.quantity > inventory.quantity - inventory.onhold) {
    //                     console.log(inventory.quantity, "inventory quantity for item", item._id.toString())
    //                     inventory.onhold += 1
    //                     await inventory.save()
    //                     if (!item.inventory) item.inventory = {}
    //                     item.inventory.inventoryType = "inventory"
    //                     item.inventory.inventory = inventory._id
    //                 } else {
    //                     if (!inventory.attached) inventory.attached = []
    //                     if (!inventory.attached.includes(item._id)) inventory.attached.push(item._id)
    //                     //inventory.onhold += 1
    //                     if (!item.inventory) item.inventory = {}
    //                     item.inventory.inventoryType = "inventory"
    //                     item.inventory.inventory = inventory._id
    //                     await inventory.save()
    //                 }
    //             }
    //         }
    //     } //else {
    // //         console.log("has inventory")
    // //         if (item.inventory.inventoryType == "productInventory" && item.inventory.productInventory) {
    // //             let productInventory = await ProductInventory.findOne({ _id: item.inventory.productInventory })
    // //             if (productInventory) {
    // //                 if (!productInventory.onhold) productInventory.onhold = 0;
    // //                 productInventory.onhold += 1
    // //                 await productInventory.save()
    // //             }
    // //         } else if (item.inventory.inventoryType == "inventory" && item.inventory.inventory) {
    // //             console.log("has inventory")
    // //             let inventory = await Inventory.findOne({ _id: item.inventory.inventory })
    // //             if (inventory) {
    // //                 console.log('here')
    // //                 if (!inventory.onhold) inventory.onhold = 0;
    // //                 inventory.onhold += 1
    // //                 await inventory.save()
    // //             }
    // //         }
    // //     }
    //     await item.save()
    // }
    return <h1>test</h1>
}