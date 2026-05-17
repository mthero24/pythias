import { NextApiRequest, NextResponse } from "next/server";
import Order from "@/models/Order";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    let order = await Order.findById(data.order._id).populate("items");
    const beforeStatus = order.status;
    order.status = "shipped";
    if (data.trackingNumber) {
        if (!order.trackingInfo) order.trackingInfo = {};
        if (!order.trackingInfo.labels) order.trackingInfo.labels = [];
        order.trackingInfo.labels.push({ trackingNumber: data.trackingNumber, provider: data.provider });
    }
    order = await order.save();
    logActivity({ action: "order_shipped", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName, email });
    logChange({ entityType: "order", entityId: order._id, entityName: order.poNumber || "", action: "order_shipped", before: { status: beforeStatus }, after: { status: "shipped", trackingNumber: data.trackingNumber || null }, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ error: false, order });
}
