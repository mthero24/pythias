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
    let labels = {
        Standard: await Items.find({
            blank: { $ne: undefined },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            designRef: { $ne: null },
            design: { $ne: null },
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: "Standard",
        }).populate("color", "name _id").populate("designRef", "sku name printType")
    }
    for (let label of labels.Standard) {
        let productInventory = await ProductInventory.findOne({ sku: label.sku })
        if (productInventory) {
            if (productInventory.quantity > 0) {
                label.inventory.inventoryType = "inventory"
                label.inventory.productInventory = productInventory._id
                productInventory.quantity -= 1
                await productInventory.save()
            }

        } else {
            let inventory = await Inventory.findOne({ blank: label.blank._id, color: label.color, sizeId: label.size })
            if (inventory) {
                if (inventory.quantity > 0 && !label.inventory?.inventoryType) {
                    label.inventory.inventoryType = "inventory"
                    label.inventory.inventory = inventory._id
                } else {
                    if (!inventory.attached) inventory.attached = []
                    if (!inventory.attached.includes(label._id)) inventory.attached.push(label._id)
                    await inventory.save()
                }
            }
        }
        await label.save()
    }
    console.log(labels.Standard.filter(l => l.inventory?.inventoryType !== undefined).map(l => ({ ...l.inventory, })), "labels.Standard")
    await pullOrders()
    return <h1>test</h1>
}