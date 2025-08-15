import {NextApiRequest, NextResponse} from "next/server";
import { InventoryOrders, Inventory, Blank, Items }from "@pythias/mongo";
import axios from "axios";
export async function GET(){
    let orders = await InventoryOrders.find({received: false}).populate("locations.items.inventory")
    return NextResponse.json({error: false, orders})
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let printItems = []
    let order = await InventoryOrders.findById(data.id)
    if (order) {
        try{
            let location = order.locations.filter(l => l.name == data.location)[0]
            for (let i of location.items) {
                let itemsToPrint = []
                let inv = await Inventory.findById(i.inventory)
                inv.quantity = inv.quantity + i.quantity
                //inv.pending_quantity = inv.pending_quantity - i.quantity
                if(inv.orders){
                    let o = inv.orders.filter(o=> o.order.toString() == order._id.toString())[0]
                    let items = await Items.find({_id: {$in: o.items}}).populate("designRef").sort({_id: -1})
                    itemsToPrint.push(...items)
                }
                //inv.orders = inv.orders.filter(o => o.order.toString() != order._id.toString())
                printItems.push(...itemsToPrint)
                await inv.save()
            }
            console.log(printItems.length)
            location.received = true
            let printLabels = await axios.post("http://localhost:3009/api/production/print-labels", { items: printItems })
            console.log(printLabels?.data)
            if (order.locations.filter(l => l.received == false).length == 0) order.received = true
            order.markModified("locations received")
            await order.save()
        }catch (e) {
            console.log(e)
            return NextResponse.json({ error: true, msg: "Something went wrong marking order received" })
        }
    }
    let orders = await InventoryOrders.find({ received: { $in: [null, false] } }).populate("locations.items.inventory")
    return NextResponse.json({ error: false, orders })
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    console.log(data)
    let order = new InventoryOrders({vendor: data.order.company, poNumber: data.order.poNumber, dateOrdered: new Date(data.order.dateOrdered), dateExpected: data.order.dateExpected? new Date(data.order.dateExpected): null, locations: [], items: data.items})
    let locations = []
    for(let i of data.needsOrdered){
        if(!locations.includes(i.location)) locations.push(i.location)
    }
    for(let loc of locations){
        let items = []
        for(let i of data.needsOrdered){
            if(i.location == loc && i.included){
                items.push({
                    inventory: i.inv._id,
                    quantity: i.order
                })
                let inv = await Inventory.findById(i.inv._id)
                inv.pending_quantity += i.order
                let it = await Items.find({ _id: { $in: inv.attached } }).sort({_id: -1})
                if(it.length > i.order){
                    it = it.slice(0, i.order)
                }
                if(!inv.orders) inv.orders = []
                inv.orders.push({
                    order: order._id,
                    items: it.map(i => i._id)
                })
                inv.attached = inv.attached.filter(a => !it.map(i => i._id.toString()).includes(a.toString()))
                await inv.save()
            }
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


    let blanks = await Blank.find({}).populate("colors").select("code name colors sizes department")
    let combined = []
    for(let blank of blanks){
        blank.inventory = inventory.filter(i=> i.blank.toString() == blank._id.toString())
        combined.push({blank, inventories: blank.inventory})
    }
    return NextResponse.json({error: false, combined, items: []})
}