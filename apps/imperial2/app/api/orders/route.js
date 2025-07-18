import {Order, Items} from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";


export async function POST(req=NextApiRequest){
    let data = await req.json()
    let orders
    let items = await Items.find({pieceId: {$regex: data.search, $options: "si"}})
    if(items.length > 0){
        orders = items.map(i=> i.order)
        orders = await Order.find({_id: {$in: orders}})
    }else{
        orders = await Order.find({$or:[
            {poNumber: {$regex: data.search, $options: "si"}},
            {orderId: {$regex: data.search, $options: "si"}},
        ]})
    }
    return NextResponse.json({error: false, orders})
}