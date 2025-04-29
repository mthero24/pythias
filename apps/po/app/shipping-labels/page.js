import Order from "@/models/Order";
import {Refund} from "@pythias/shipping"
export const dynamic = 'force-dynamic';
export default async function ShippingLabels(req){
    let page = 1
    let orders = await Order.find({"shippingInfo.labels.delivered": {$in: [false]}, date: {$gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000))}, "selectedShipping.provider": "usps"}).sort({date: 1}).select("shippingInfo date poNumber").limit(50)
    let count = await Order.find({"shippingInfo.labels.delivered": {$in: [false]}, date: {$gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000))}, "selectedShipping.provider": "usps"}).countDocuments()
    console.log(orders.length, count)
    orders = JSON.parse(JSON.stringify(orders))
    return (
        <Refund ords={orders} page={page}/>
    )
}