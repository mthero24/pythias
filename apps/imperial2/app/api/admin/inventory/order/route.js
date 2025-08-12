import {NextApiRequest, NextResponse} from "next/server";
import { InventoryOrders, Inventory, Blank, Items }from "@pythias/mongo";
import axios from "axios";
export async function GET(){
    let orders = await InventoryOrders.find({}).populate("locations.items.inventory")
    return NextResponse.json({error: false, orders})
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let printItems = []
    let order = await InventoryOrders.findById(data.id)
    if (order) {
        let location = order.locations.filter(l => l.name == data.location)[0]
        for (let i of location.items) {
            let itemsToPrint = []
            let inv = await Inventory.findById(i.inventory)
            inv.quantity = inv.quantity + i.quantity
            inv.pending_quantity = inv.pending_quantity - i.quantity
            if (inv.quantity > 0 && inv.attached.length > 0) {
                for (let j = 0; j < inv.quantity; j++) {
                    console.log(inv.attached[j], "inv.attached[j]")
                    if(!inv.attached[j]) continue;
                    let item = await Items.findOne({ _id: inv.attached[j] })
                    item.inventory = {
                        inventoryType: "inventory",
                        inventory: inv._id,
                        productInventory: null,
                    }
                    await item.save()
                    itemsToPrint.push(item)

                }
            }
            inv.attached = inv.attached.filter(a => !location.items.map(i => i._id.toString()).includes(a.toString()))
            inv.quantity = inv.quantity - itemsToPrint.length;
            printItems.push(...itemsToPrint)
            await inv.save()
        }
        console.log(printItems.length)
        location.received = true
        let printLabels = await axios.post("https://imperial.pythiastechnologies.com/api/production/print-labels", { items: printItems })
        console.log(printLabels?.data)
        if (order.locations.filter(l => l.received == false).length == 0) order.received = true
        order.markModified("locations received")
        await order.save()
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