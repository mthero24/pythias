import {NextApiRequest, NextResponse} from "next/server";
import InventoryOrders from "@/models/InventoryOrders";
import Inventory from "@/models/inventory";
import Blanks from "@/models/Blanks";
import Items from "@/models/Items";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    console.log(data)
    let order = new InventoryOrders({vendor: data.order.company, poNumber: data.order.poNumber, dateOrdered: new Date(data.order.dateOrdered), dateExpected: new Date(data.order.dateExpected), locations: []})
    let locations = []
    for(let i of data.needsOrdered){
        if(!locations.includes(i.location)) locations.push(i.location)
    }
    for(let loc of locations){
        let items = []
        for(let i of data.needsOrdered){
            items.push({
                inventory: i.inv._id,
                quantity: i.order
            })
            await Inventory.findByIdAndUpdate(i.inv._id, {pending_quantity: i.order})
        }
        //console.log(items)
        order.locations.push({
            name: loc,
            received: false,
            items
        })
    }
    console.log(order)
    await order.save()
    let inventory = await Inventory.find({}).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location")
    let items = await Items.find({labelPrinted: false, status: "awaiting_shipment"}).select("colorName sizeName blank")
    console.log("inventory", inventory.length)
    let blanks = await Blanks.find({}).populate("colors").select("code name colors sizes department")
    let combined = []
    for(let blank of blanks){
        blank.inventory = inventory.filter(i=> i.blank.toString() == blank._id.toString())
        combined.push({blank, inventories: blank.inventory})
    }
    return NextResponse.json({error: false, combined, items})
}