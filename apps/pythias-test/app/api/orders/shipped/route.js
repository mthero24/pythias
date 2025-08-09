import {NextApiRequest, NextResponse} from "next/server";
import Order from "@/models/Order";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let order = await Order.findById(data.order._id).populate("items")
    order.status= "shipped"
    if(data.trackingNumber){
        console.log(order.trackingInfo)
        if(!order.trackingInfo) order.trackingInfo = {}
        if(!order.trackingInfo.labels) order.trackingInfo.labels = []
        order.trackingInfo.labels.push({trackingNumber: data.trackingNumber, provider: data.provider})
    }
    order = await order.save()
    return NextResponse.json({error: false, order})
}