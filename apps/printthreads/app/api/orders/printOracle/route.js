import { printOracle } from "@/functions/printOracle";
import { Order } from "@pythias/mongo";
import { NextResponse, NextApiRequest } from "next/server";

export async function GET(req = NextApiRequest) {
    let { searchParams } = new URL(req.url);
    let orderId = searchParams.get("orderId");
    let orderInfo = await printOracle.getOrderInfo(orderId);
    console.log(orderInfo);
    return NextResponse.json({ error: false, order: orderInfo });
}
export async function POST(req = NextApiRequest) {
    let data = await req.json();
    
    await printOracle.sendOrder(data.orderId);
    return NextResponse.json({ error: false, msg: "Order sent to Print Oracle" });
}