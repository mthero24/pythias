import { NextApiRequest, NextResponse } from "next/server";
import Bins from "../../../../models/Bin";
import Order from "../../../../models/Order";
import Item from "../../../../models/Items";

export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    let item = await Item.findOne({pieceId: data.scan.trim()}).populate({path: "order", populate: "items"}).lean()
    let order = await Order.findOne({poNumber: data.scan.trim()}).populate("items").lean()
    let bin 
    try{
       bin = await Bins.findOne({ number: data.scan.trim() })
         .populate({ path: "order", populate: "items" })
         .lean();
    }catch(e){
        console.log(e)
    }
    return NextResponse.json({item, order, bin})
}