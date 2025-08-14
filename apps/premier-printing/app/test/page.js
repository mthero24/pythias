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
    //await pullOrders()
    // let orders = await Order.find({items: {$size: 0}, status: {$nin: ["cancelled", "shipped"]}}).sort({_id: -1})
    // for(let order of orders){
    //     let items = await Items.find({order: order._id})
    //     console.log(items.length, "items for order", order.poNumber)
    //     if(items.length > 0) order.items = items
    //     await order.save()
    // }
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: "6650514796_1-A" })
    console.log(orders)
    return <h1>test</h1>
}