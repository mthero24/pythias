import { NextResponse } from "next/server";
import Order from "@/models/Order";

export async function POST(req) {
    const { id, shippingAddress } = await req.json();
    const order = await Order.findByIdAndUpdate(
        id,
        { $set: { shippingAddress } },
        { new: true, select: "shippingAddress" }
    ).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ shippingAddress: order.shippingAddress });
}
