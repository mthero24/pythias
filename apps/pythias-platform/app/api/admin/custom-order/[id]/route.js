import { NextResponse } from "next/server";
import { PlatformOrder as Order, PlatformItem as Item, PlatformInventory as Inventory } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { updateInventory, recomputeStockStatus } from "@/functions/pullOrders";

export async function GET(request, { params }) {
    const token = await getToken({ req: request });
    const orgId = token?.orgId;
    const order = await Order.findOne({ _id: params.id, orgId, marketplace: "custom order" }).populate("items").lean();
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
}

export async function PATCH(request, { params }) {
    const token = await getToken({ req: request });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const data  = await request.json();

    const order = await Order.findOne({ _id: params.id, orgId, marketplace: "custom order" });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.poNumber        !== undefined) order.poNumber        = data.poNumber;
    if (data.shipByDate      !== undefined) order.shipByDate      = data.shipByDate ? new Date(data.shipByDate) : null;
    if (data.shippingCost    !== undefined) order.shippingCost    = data.shippingCost;
    if (data.taxRate         !== undefined) order.taxRate         = data.taxRate;
    if (data.customerEmail   !== undefined) order.customerEmail   = data.customerEmail;
    if (data.shippingAddress !== undefined) order.shippingAddress = data.shippingAddress;
    if (data.status          !== undefined) order.status          = data.status;
    if (data.notes           !== undefined) order.notes           = data.notes;

    if (data.paid === true && !order.paid) {
        order.paid   = true;
        order.status = "awaiting_shipment";

        await Item.updateMany(
            { order: order._id, orgId },
            { $set: { paid: true, status: "awaiting_shipment" } }
        );

        // Assign inventory record to each item so recompute can slot them correctly
        const items = await Item.find({ order: order._id, orgId });
        for (const item of items) {
            if (item.inventory?.inventory) continue;
            const inv = await Inventory.findOne({
                orgId,
                color_name: item.colorName,
                size_name:  item.sizeName,
                style_code: item.styleCode,
            });
            if (inv) {
                item.inventory = { inventoryType: "inventory", inventory: inv._id };
                await item.save();
            }
        }

        // Fire-and-forget full recompute — updates inStock/attached arrays and stockStatus on all items
        updateInventory().then(() => recomputeStockStatus()).catch(err => console.error("[custom-order mark-paid recompute]", err));
    }

    await order.save();
    logActivity({ action: "custom_order_update", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName, email, orgId });
    const populated = await Order.findById(order._id).populate("items").lean();
    return NextResponse.json({ order: populated });
}

export async function DELETE(request, { params }) {
    const token = await getToken({ req: request });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    const order = await Order.findOne({ _id: params.id, orgId, marketplace: "custom order" });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await Item.deleteMany({ order: order._id, orgId });
    await order.deleteOne();
    logActivity({ action: "custom_order_delete", entity: "order", entityId: params.id, entityName: "", userName, email, orgId });
    return NextResponse.json({ ok: true });
}
