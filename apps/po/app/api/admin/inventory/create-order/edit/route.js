import { NextApiRequest, NextResponse } from "next/server"
import { Inventory, InventoryOrders } from "@pythias/mongo";
import Items from "@/models/Items";
import { getToken } from "next-auth/jwt";
import { logChange, userFromToken } from "@pythias/backend/server";

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json()
    let order = await InventoryOrders.findById(data.orderId)
    console.log(order, data)
    if(order){
        order.locations = data.items
        for(let l of order.locations){
            for(let i of l.items){
                let inv = await Inventory.findById(i.inventory._id)
                console.log(inv, "inv")
                if(inv){
                    let o = inv.orders.filter(or => or.order.toString() == order._id.toString())[0]
                    if(o){
                        o.quantity = i.quantity
                    }
                    await inv.save()
                    console.log(inv, "inv")
                }
            }
        }
        await order.save()
        logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "update", userName, email, provider: "po" });
        return NextResponse.json({msg: "Order updated successfully", error: false})
    }else{
        return NextResponse.json({error: "Order not found"})
    }
}
export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json()
    let order = await InventoryOrders.findById(data.orderId)
    if (order) {
        order.locations = data.items
        const removedItemIds = [];
        for (let l of order.locations) {
            for (let i of l.items) {
                let inv = await Inventory.findById(i.inventory._id)
                if (inv) {
                    const removing = inv.orders
                        .filter(or => or.order.toString() == order._id.toString())
                        .flatMap(or => or.items || []);
                    removedItemIds.push(...removing);
                    inv.orders = inv.orders.filter(or => or.order.toString() != order._id.toString())
                    await inv.save()
                }
            }
        }
        await order.save()
        // Fire-and-forget: reset stockStatus on removed items
        if (removedItemIds.length > 0) {
            Items.updateMany(
                { _id: { $in: removedItemIds }, stockStatus: "ordered" },
                { $set: { stockStatus: "attached" } }
            ).catch(() => {});
        }
        logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "delete_item", userName, email, provider: "po" });
        return NextResponse.json({ msg: "Order updated successfully", error: false })
    } else {
        return NextResponse.json({ error: "Order not found" })
    }
}