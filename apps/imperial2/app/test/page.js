import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order,  ProductInventory, Blank, Design, Color, Item, } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
import { isSingleItem } from "@/functions/itemFunctions";
const CreateSku = async ({ blank, color, size, design, threadColor }) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor ? `_${threadColor}` : ""}`;
    return sku;
}
let colorFixer = {
    "White/Black": "Blk/Wht",
    Sand: "Khaki",
    "Red/Sand": "Red/Natl",
    "Blue/Sand": "Ryl/Natl",
    "Ash Grey": "Ash",
    "Pink": "Light Pink, blossom, Blossom",
    "Green/Sand": "Dk.Grn/Kha",
    Blue: "Lt.Blue"
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
    if (productInventory && productInventory.quantity > productInventory.quantity - productInventory.onhold) {
        if (productInventory.quantity > productInventory.quantity - productInventory.onhold) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.onhold += 1
            await productInventory.save()
            await item.save();
        }

    } else {
        let inventory = await Inventory.findOne({ blank: blank._id, color: color ? color._id : null, sizeId: size?._id ? size._id.toString() : size?.toString() })
        console.log(inventory, "inventory")
        if (inventory) {
            if (inventory.quantity > inventory.quantity - inventory.onhold) {
                inventory.onhold += 1
                await inventory.save()
                if (!item.inventory) item.inventory = {}
                item.inventory.inventoryType = "inventory"
                item.inventory.inventory = inventory._id
                await item.save();
            } else {
                if (!inventory.attached) inventory.attached = []
                if (!inventory.attached.includes(item._id.toString())) inventory.attached.push(item._id)
                inventory.onhold += 1
                if (!item.inventory) item.inventory = {}
                item.inventory.inventoryType = "inventory"
                item.inventory.inventory = inventory._id
                await inventory.save()
                await item.save();
            }
        }
    }
    return item;
}
export default async function Test(){
    
   //await pullOrders();
    
    return <h1>test</h1>
}