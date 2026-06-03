import { NextApiRequest, NextResponse } from "next/server"
import { PlatformInventory as Inventory, PlatformInventoryOrder as InventoryOrders } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logChange, userFromToken } from "@pythias/backend/server";

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    let data = await req.json()
    let order = await InventoryOrders.findOne({ _id: data.orderId, orgId })
    if (order) {
        order.locations = data.items
        for (let l of order.locations) {
            for (let i of l.items) {
                let inv = await Inventory.findOne({ _id: i.inventory._id, orgId })
                if (inv) {
                    let o = inv.orders.filter(or => or.order.toString() == order._id.toString())[0]
                    if (o) {
                        o.quantity = i.quantity
                    }
                    await inv.save()
                }
            }
        }
        await order.save()
        logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "update", userName, email });
        return NextResponse.json({ msg: "Order updated successfully", error: false })
    } else {
        return NextResponse.json({ error: "Order not found" })
    }
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    let data = await req.json()
    let order = await InventoryOrders.findOne({ _id: data.orderId, orgId })
    if (order) {
        order.locations = data.items
        for (let l of order.locations) {
            for (let i of l.items) {
                let inv = await Inventory.findOne({ _id: i.inventory._id, orgId })
                if (inv) {
                    inv.orders = inv.orders.filter(or => or.order.toString() != order._id.toString())
                    await inv.save()
                }
            }
        }
        await order.save()
        logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "delete_item", userName, email });
        return NextResponse.json({ msg: "Order updated successfully", error: false })
    } else {
        return NextResponse.json({ error: "Order not found" })
    }
}
