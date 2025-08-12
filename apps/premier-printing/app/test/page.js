import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order} from "@pythias/mongo"
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
    await pullOrders()
    // let orders = await Order.find({items: {$size: 0}, status: {$nin: ["cancelled", "shipped"]}}).sort({_id: -1})
    // for(let order of orders){
    //     let items = await Items.find({order: order._id})
    //     console.log(items.length, "items for order", order.poNumber)
    //     if(items.length > 0) order.items = items
    //     await order.save()
    // }
    // let items = await Items.find({"inventory.inventoryType": null, labelPrinted: false}).sort({_id: -1})
    // console.log(items.length, "items without inventory")
    // for(let item of items){
    //     let productInventory = await ProductInventory.findOne({ sku: item.sku })
    //     if (productInventory) {
    //         if (productInventory.quantity > 0) {
    //             item.inventory = { type: "productInventory", productInventory: productInventory._id }
    //             productInventory.quantity -= 1
    //             await productInventory.save()
    //         }
    //     } else {
    //         let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
    //         //console.log(inventory?.quantity, "inventory quantity for item",)
    //         if (inventory) {
    //             if (inventory.quantity > 0) {
    //                 console.log(inventory.quantity, "inventory quantity for item", item._id.toString())
    //                 inventory.quantity -= 1
    //                 await inventory.save()
    //                 if(!item.inventory) item.inventory = {}
    //                 item.inventory.inventoryType = "inventory"
    //                 item.inventory.inventory = inventory._id
    //             } else {
    //                 if (!inventory.attached) inventory.attached = []
    //                 if(!inventory.attached.includes(item._id)) inventory.attached.push(item._id)
    //                 await inventory.save()
    //             }
    //         }
    //     }
    //     await item.save()
    //     console.log(item.inventory)
    // }
    return <h1>test</h1>
}