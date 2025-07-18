import { NextApiRequest, NextResponse } from "next/server";
import {Order} from "@pythias/mongo"

export async  function POST(req = NextApiRequest){
    let data = await req.json()
    try{
        await Order.findOneAndUpdate({_id: data.id}, {shippingAddress: {...data.shippingAddress}})
        return NextResponse.json({
            error: false,
        });
    }catch(e){
        return NextResponse.json({
            error: false,
            msg: e
        });
    }
}