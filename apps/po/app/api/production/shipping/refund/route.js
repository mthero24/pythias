import { NextResponse, NextApiRequest } from "next/server";
import Order from "@/models/Order"
import {getRefund} from "@pythias/shipping"
export async function POST(req= NextApiRequest){
    let data = await req.json()
    console.log(data)
}

export async function PUT(req= NextApiRequest){
    let data = await req.json()
    console.log(data.order._id)
    let order = await Order.findOne({_id: data.order._id})
    console.log(order.shippingInfo.labels.length)
    if(order){
        order.shippingInfo.labels.map(l=> {
            console.log(l.trackingNumber.toString() == data.label.trackingNumber.toString(), l.trackingNumber, data.label.trackingNumber)
            if(l.trackingNumber.toString() == data.label.trackingNumber.toString()) l.delivered = true
            return l
        })
        order.markModified("shippingInfo.labels")
        await order.save()
    }
    let orders = await Order.find({"shippingInfo.labels.delivered": {$in: [false, undefined]}, date: {$gt: new Date(Date.now() - 60 * (24 * 60 * 60 * 1000))}, "selectedShipping.provider": "usps"}).select("shippingInfo date poNumber").skip(data.page * 50 - 50).limit(50)
    return NextResponse.json({error: false, orders})
}