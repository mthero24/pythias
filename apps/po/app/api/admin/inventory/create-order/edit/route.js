import { NextApiRequest, NextResponse } from "next/server"
import { Inventory, InventoryOrders } from "@pythias/mongo";

export async function PUT(req = NextApiRequest) {
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
        return NextResponse.json({msg: "Order updated successfully", error: false})
    }else{
        return NextResponse.json({error: "Order not found"})
    }
}
export async function POST(req = NextApiRequest) {
    let data = await req.json()
    let order = await InventoryOrders.findById(data.orderId)
    console.log(order, data)
    if (order) {
        order.locations = data.items
        for (let l of order.locations) {
            for (let i of l.items) {
                let inv = await Inventory.findById(i.inventory._id)
                console.log(inv, "inv")
                if (inv) {
                    inv.orders = inv.orders.filter(or => or.order.toString() != order._id.toString())
                    await inv.save()
                    console.log(inv, "inv")
                }
            }
        }
        await order.save()
        return NextResponse.json({ msg: "Order updated successfully", error: false })
    } else {
        return NextResponse.json({ error: "Order not found" })
    }
}