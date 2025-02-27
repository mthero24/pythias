import Order from "@/models/Order";
import {Main} from "./Main";
import { serialize } from "@/functions/serialize";

export default async function OrdersPage(){
    let orders = await Order.find({}).sort({date: -1}).populate("items").select("poNumber marketplace items status date total")
    console.log(orders.length)
    orders = serialize(orders)
    return <Main ords={orders} />
}