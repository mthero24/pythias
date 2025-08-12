import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order, Items, ProductInventory, Blank, Design, Color, Item } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
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

    // let items = await Items.find({labelPrinted: false })
    // for(let item of items){
    //     let productInventory = await ProductInventory.findOne({ sku: item.sku })
    //     if (productInventory) {
    //         if (productInventory.quantity > 0) {
    //             item.inventory = { type: "productInventory", ProductInventory: productInventory._id }
    //             productInventory.quantity -= 1
    //             await productInventory.save()
    //         }

    //     } else {
    //         if(item.size && item.blank && item.color){
    //             let inventory = await Inventory.findOne({ blank: item.blank, color: item.color ? item.color._id : null, sizeId: item.size_id ? item.size_id.toString() : item.size.toString() })
    //             if (inventory) {
    //                 if (inventory.quantity > 0) {
    //                     inventory.quantity -= 1
    //                     await inventory.save()
    //                     item.inventory = { type: "inventory", Inventory: inventory._id }
    //                 } else {
    //                     if (!inventory.attached) inventory.attached = []
    //                     if (!inventory.attached.includes(item._id)) {
    //                         inventory.attached.push(item._id)
    //                         console.log("pushed item to inv.attached")
    //                     }
    //                     await inventory.save()
    //                 }
    //             }
    //         }
    //     }
    //     await item.save();
    // }
    // console.log(items.length, "items to update")
    //await pullOrders("577070468438331861")
    // const colors = await Color.find({}).lean();
    // let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: "577069874302062641" },  "1733" )
    // console.log(orders)
    // console.log(orders.length, "orders", orders[0])
    // for(let o of orders){
    //     if (o.customerNotes?.includes("tiktok_fulfillment_type: 3PL")) continue;
    //     let order = await Order.findOne({ orderId: o.orderId }).populate("items")
    //     console.log(order.items)
    //     for(let i of o.items){
    //         if(i.sku){
    //             console.log(i.sku, "sku")
    //             let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { sku: i.sku } } }, { variantsArray: { $elemMatch: { previousSkus: i.sku } } }] }).populate("variantsArray.blank variantsArray.color variantsArray.threadColor").lean();
    //             console.log(product, "product")
    //             if(!product) {
    //                  let sku = i.sku.split("_")
    //                 let blank
    //                 let threadColor
    //                 let designSku = sku[1]
    //                 let colorName = sku[2]
    //                 let sizeName = sku[3]
    //                 console.log(sizeName, sizeFixer[sizeName])
    //                 if (sku.length == 5) {
    //                     blank = sku[sku.length - 1]
    //                 } else {
    //                     blank = sku[sku.length - 2]
    //                     threadColor = sku[sku.length - 1]
    //                 }
    //                 blank = await Blank.findOne({ code: blank }).populate("colors")
    //                 let design = await Design.findOne({ sku: designSku })
    //                 let blankColor = blank?.colors.filter(c => c.name.toLowerCase() == colorName.toLowerCase() || c.sku.toLowerCase() == colorName.toLowerCase())[0]
    //                 let blankSize = blank?.sizes.filter(c => c.name.toLowerCase() == sizeName.toLowerCase() || c.name.toLowerCase() == sizeFixer[sizeName]?.toLowerCase())[0]
    //                 let DesignThreadColor = colors.filter(c => c.name.toLowerCase() == threadColor?.toLowerCase() || c.sku.toLowerCase() == threadColor?.toLowerCase())[0]
    //                 let designImages
    //                 if (DesignThreadColor) {
    //                     //console.log((design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined), "design images")
    //                     if (design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined) designImages = design.threadImages[DesignThreadColor.name]
    //                     else if (design != undefined && design.threadImages != undefined && design.threadImages[threadColor] != undefined) designImages = design.threadImages[threadColor]
    //                     else if (design) designImages = design.images
    //                 } else if (design) {
    //                     designImages = design.images
    //                 }
    //                 console.log(blankColor, blankSize, DesignThreadColor, designImages, "blankColor, blankSize, DesignThreadColor, designImages")
    //                 let item = await createItem({ i, order, design, blank, size: blankSize, color: blankColor, threadColor: DesignThreadColor, sku: i.sku })
    //                 console.log(item, "item created")
    //                 order.items.push(item._id)
    //             }
    //         }
    //     }
    //     await order.save()
    // }
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