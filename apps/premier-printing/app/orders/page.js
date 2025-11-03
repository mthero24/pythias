import { Order, Item } from "@pythias/mongo";
import { OrdersMain } from "@pythias/backend";
import { serialize } from "@/functions/serialize";
export const dynamic = 'force-dynamic';
import "@/functions/pullOrders";
export default async function OrdersPage(req) {
    let query = await req.searchParams
    let page = 1
    if (query.page) page = parseInt(query.page)
    let orders
    let count
    if(query.filter == "blank"){
        let itemsWithBlanks = await Item.find({ isBlank: true }).select("order").distinct("order")
        orders = await Order.find({ _id: { $in: itemsWithBlanks }, status: "awaiting_shipment", "items.0": { $exists: true } }).sort({ date: -1 }).populate("items").select("poNumber marketplace items status date total").skip((page * 200) - 200).limit(200)
        count = await Order.find({ _id: { $in: itemsWithBlanks }, status: "awaiting_shipment", "items.0": { $exists: true } }).countDocuments()
    }else if(query.filter == "missinginfo"){
        let itemsWithMissingInfo = await Item.find({ $or: [{ colorName: { $in: [null, ""] } }, { sizeName: { $in: [null, ""] } }, { design: { $in: [null, ""] }, isBlank: false }, { styleCode: { $in: [null, ""] } } ] }).select("order").distinct("order")
        orders = await Order.find({ _id: { $in: itemsWithMissingInfo }, status: "awaiting_shipment", "items.0": { $exists: true } }).sort({ date: -1 }).populate("items").select("poNumber marketplace items status date total").skip((page * 200) - 200).limit(200)
        count = await Order.find({ _id: { $in: itemsWithMissingInfo }, status: "awaiting_shipment", "items.0": { $exists: true } }).countDocuments()
    }else{
        orders = await Order.find({ status: "awaiting_shipment", "items.0": { $exists: true } }).sort({ date: -1 }).populate("items").select("poNumber marketplace items status date total").skip((page * 200) - 200).limit(200)
        count = await Order.find({ status: "awaiting_shipment", "items.0": { $exists: true } }).countDocuments()
    }
    let pages = Math.round(count / 200) + 1
    //console.log(orders.length)
    orders = serialize(orders)
    return <OrdersMain ords={orders} page={page} pages={pages} filter={query.filter} />
}