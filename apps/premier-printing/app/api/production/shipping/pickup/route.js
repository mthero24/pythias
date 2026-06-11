import { NextResponse } from "next/server";
import { Order, Item, Bin } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";

// POST — mark an in-store pickup order as picked up, clear its bin
export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await Order.findById(orderId).populate("items");
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.inStorePickup) return NextResponse.json({ error: "Not an in-store pickup order" }, { status: 400 });

    // Mark all items as shipped (picked up)
    const itemIds = order.items.map(i => i._id);
    await Item.updateMany(
        { _id: { $in: itemIds } },
        { $set: { shipped: true, shippedDate: new Date() }, $push: { steps: { status: "Picked Up", date: new Date() } } }
    );

    // Mark order as picked up
    order.status = "Picked Up";
    order.shippingInfo = order.shippingInfo || {};
    order.shippingInfo.shippedAt = new Date();
    await order.save();

    // Clear the bin
    await Bin.findOneAndUpdate(
        { order: order._id },
        { items: [], ready: false, inUse: false, order: null, giftWrap: false, readyToWrap: false, wrapped: false, wrapImage: null }
    );

    logActivity({ action: "order_picked_up", entity: "order", entityId: order._id, entityName: order.poNumber || order.orderId || "", userName, email, provider: "premierPrinting" });

    return NextResponse.json({
        error: false,
        bins: {
            readyToShip: await Bin.find({ ready: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
            inUse:       await Bin.find({ inUse: true }).sort({ number: 1 }).populate({ path: "order", populate: "items" }).lean(),
        },
    });
}
