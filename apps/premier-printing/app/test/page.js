import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    //await pullOrders()
    let labels = {
            Standard: await Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: "Standard",
        }).populate("color", "name _id").populate("designRef", "sku name printType"),
            Expedited: await Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: { $ne: "Standard" },
            }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory")
    }
    // for (let label of labels.Standard) {
    //     let productInventory = await ProductInventory.findOne({ sku: label.sku })
    //     if (productInventory) {
    //         if (productInventory.quantity > 0) {
    //             label.inventory.inventoryType = "inventory"
    //             label.inventory.productInventory = productInventory._id
    //             productInventory.quantity -= 1
    //             await productInventory.save()
    //         }

    //     } else {
    //         let inventory = await Inventory.findOne({ blank: label.blank._id, color: label.color, sizeId: label.size })
    //         if (inventory) {
    //             if (inventory.quantity > 0) {
    //                 label.inventory.inventoryType = "inventory"
    //                 label.inventory.inventory = inventory._id
    //             } else {
    //                 if (!inventory.attached) inventory.attached = []
    //                 if (!inventory.attached.includes(label._id)) inventory.attached.push(label._id)
    //                 await inventory.save()
    //             }
    //         }
    //     }
    //     await label.save()
    // }
    // for (let label of labels.Expedited) {
    //     let productInventory = await ProductInventory.findOne({ sku: label.sku })
    //     if (productInventory) {
    //         if (productInventory.quantity > 0) {
    //             label.inventory.inventoryType = "productInventory"
    //             label.inventory.productInventory = productInventory._id
    //             productInventory.quantity -= 1
    //             await productInventory.save()
    //         }

    //     } else {
    //         let inventory = await Inventory.findOne({ blank: label.blank._id, color: label.color, sizeId: label.size })
    //         if (inventory) {
    //             if (inventory.quantity > 0 && !label.inventory?.inventoryType) {
    //                 label.inventory.inventoryType = "inventory"
    //                 label.inventory.inventory = inventory._id
    //             } else {
    //                 if (!inventory.attached) inventory.attached = []
    //                 if (!inventory.attached.includes(label._id)) inventory.attached.push(label._id)
    //                 await inventory.save()
    //             }
    //         }
    //     }
    //     await label.save()
    // }
    console.log(labels.Expedited.filter(l => l.inventory?.inventoryType !== undefined).map(l => ({ ...l.inventory, })), "labels.Expedited")
    return <h1>test</h1>
}