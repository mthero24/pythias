import { NextResponse } from "next/server";
import { Order } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const { id, shippingAddress } = await req.json();
    const before = await Order.findById(id).select("shippingAddress poNumber").lean();
    if (!before) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = await Order.findByIdAndUpdate(
        id,
        { $set: { shippingAddress } },
        { new: true, select: "shippingAddress" }
    ).lean();
    logActivity({ action: "order_address_update", entity: "order", entityId: id, entityName: before.poNumber || "", userName, email });
    logChange({ entityType: "order", entityId: id, entityName: before.poNumber || "", action: "address_update", before: before.shippingAddress, after: shippingAddress, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ shippingAddress: order.shippingAddress });
}
