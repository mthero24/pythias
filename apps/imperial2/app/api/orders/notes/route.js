import {NextApiRequest, NextResponse} from "next/server";
import {Order} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    console.log(token)
    let data = await req.json()
    let order = await Order.findById(data.order._id).populate("items")
    if(!order.notes) order.notes = []
    order.notes.push({
        userName: token.userName,
        date: new Date(Date.now()),
        note: data.note
    })
    order = await order.save()
    return NextResponse.json({error: false, order})
}