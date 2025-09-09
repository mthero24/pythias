import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order,  ProductInventory, Blank, Design, Color, Item as Items, } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
import { isSingleItem } from "@/functions/itemFunctions";

export default async function Test(){
  // await pullOrders();
    // let order = await InventoryOrders.findOne({ _id: "68bb3e4a1b69f041007e10c1" }).populate("locations.items.inventory")
    // console.log(order)
    // for (let loc of order.locations) {
    //     for (let item of loc.items) {
    //         item.inventory.orders = item.inventory.orders.filter(o => o.order !== order._id.toString())
    //         let labels = await Items.find({ "inventory.inventory": item.inventory._id, labelPrinted: false, canceled: false, paid: true }).sort({ _id: 1 }).limit(item.quantity)
    //         console.log(labels.length, item.quantity)
    //         item.inventory.orders.push({
    //             order: order._id.toString(),
    //             items: labels.map(l => l._id.toString())
    //         })
    //         await item.inventory.save()
    //     }
    // }
    return <h1>test</h1>
}