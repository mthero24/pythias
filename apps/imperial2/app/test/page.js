import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products, Order,  ProductInventory, Blank, Design, Color, Item, } from "@pythias/mongo"
import axios from "axios";
import btoa from "btoa";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { create } from "@mui/material/styles/createTransitions";
import { isSingleItem } from "@/functions/itemFunctions";


export default async function Test(){
    // let item = await Item.findOne({ pieceId: "3LZ8VCWA5" }).populate("inventory.inventory")
    // item.inventory.inventory = await Inventory.findOne({ style_code: item.styleCode, color_name: item.colorName, size_name: item.sizeName, })
    // item.inventory.invetoryType = "inventory"
    // console.log(item.inventory, "item inventory")
    //await item.save()
   //await pullOrders();
    // let order = await InventoryOrders.findOne({ _id: "689f9112000d8326706d6379"}).populate("locations.items.inventory")
    // for(let loc of order.locations){
    //     for(let item of loc.items){
    //        //console.log(item, "item")
    //         let addItems = await Item.find({"inventory.inventory": item.inventory._id, canceled: false, paid: true, shipped: false, labelPrinted: false}).sort({_id: 1})
    //         console.log(addItems.length, "add items")
    //         console.log(item.quantity, "inv quantity before")
    //         item.inventory.orders = item.inventory.orders.filter(o=> o.order.toString() !== order._id.toString())
    //         item.inventory.orders.push({order: order._id, items: []})
    //         for(let i = 0; i < item.quantity; i++){
    //             let addItem = addItems[i];
    //             if(addItem){
    //                 let o = item.inventory.orders.filter(o=> o.order.toString() == order._id.toString())[0]
    //                 o.items.push(addItem._id)
    //                 item.inventory.inStock = item.inventory.inStock.filter(it=> it.toString() !== addItem._id.toString())
    //                 item.inventory.attached = item.inventory.attached.filter(it=> it.toString() !== addItem._id.toString())
    //             }
    //         }
    //         console.log(item.inventory.orders, "new orders")
    //         await item.inventory.save();
    //     }
    // }
    // let noInv = await Item.find({inventory: {$exists: false}, canceled: false, paid: true, shipped: false, labelPrinted: false, design: {$ne: null}, status: {$ne: "shipped"}}).sort({_id: 1}).populate("order", "poNumber")
    // for(let item of noInv){
    //     item.inventory = {
    //         inventoryType: "inventory",
    //         inventory: await Inventory.findOne({color: item.color, sizeId: item.size, blank: item.blank}),
    //     }
    //     console.log(item, "no inv item")
    //     await item.save()
    // }
    // console.log(noInv.length, "no inv items")
     let inventories = await Inventory.find({})
     console.log(inventories.length, "inventories")
    for (let inv of inventories) {
        let items = await Item.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
        if (inv.quantity < 0) {
            inv.quantity = 0;
        }
        inv.attached= []
        inv.inStock= []
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
            if (inv.quantity > 0) {
                if (inv.quantity > inv.inStock.length + inv.attached.length) {
                    inv.attached = [];
                }
            }
            let newInStck = [];
            for (let id of inv.inStock) {
                if (!newInStck.includes(id) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(id)) {
                    newInStck.push(id);
                }
            }
            inv.inStock = newInStck;
            let newAttached = [];
            for (let id of inv.attached) {
                if (!newAttached.includes(id) && !inv.inStock.includes(id)) {
                    newAttached.push(id);
                }
            }
            inv.attached = newAttached;
            console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
            if (inv.quantity > 0) {
                for (let item of items) {
                    if (inv.quantity - inv.inStock.length > 0 && !inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString())
                    } else if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString())
                    }
                }
                await inv.save()
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                    await inv.save()
                }
            }
        }
    }
    return <h1>test</h1>
}