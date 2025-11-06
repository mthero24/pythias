import Order from "../../models/Order";
import {serialize} from "@pythias/backend";
import {BulkMain} from "@pythias/labels";
export const dynamic = 'force-dynamic';
export default async function Bulk(){
    let orders = await Order.find({bulk: true, status: {$nin: ["canceled", "returned", "shipped", "Shipped", "delivered"]}, bulkPrinted: {$in: [false, null]}}).populate({path: "items", populate: {path: "inventory.inventory"}}).lean();
    orders = serialize(orders)
    console.log("bulk orders found", orders.length)
    return <BulkMain orders={orders}/>
}