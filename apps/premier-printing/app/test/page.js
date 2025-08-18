import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import { getOrders, generatePieceID } from "@pythias/integrations";
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${blank.code}_${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}_${design.sku}`;
    return sku;
}
export default async function Test(){
   await pullOrders();
    // let inventories = await Inventory.find({})
    // console.log(inventories.length, "inventories")
    // for (let inv of inventories) {
    //     let items = await Items.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
    //     if (inv.quantity < 0) {
    //         inv.quantity = 0;
    //     }
    //     if (items.length > 0) {
    //         let itemIds = items.map(i => i._id.toString());
    //         inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
    //         inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
    //         if (inv.quantity > 0) {
    //             if (inv.quantity > inv.inStock.length + inv.attached.length) {
    //                 inv.attached = [];
    //             }
    //         }
    //         let newInStck = [];
    //         for (let id of inv.inStock) {
    //             if (!newInStck.includes(id) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(id)) {
    //                 newInStck.push(id);
    //             }
    //         }
    //         inv.inStock = newInStck;
    //         let newAttached = [];
    //         for (let id of inv.attached) {
    //             if (!newAttached.includes(id) && !inv.inStock.includes(id)) {
    //                 newAttached.push(id);
    //             }
    //         }
    //         inv.attached = newAttached;
    //         console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    //         if (inv.quantity > 0) {
    //             for (let item of items) {
    //                 if (inv.quantity - inv.inStock.length > 0 && inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
    //                     inv.inStock.push(item._id.toString())
    //                 } else if (inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
    //                     inv.attached.push(item._id.toString())
    //                 }
    //             }
    //             await inv.save()
    //         } else {
    //             if (items.length > 0) {
    //                 for (let item of items) {
    //                     if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
    //                         inv.attached.push(item._id.toString())
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
    return <h1>test</h1>
}