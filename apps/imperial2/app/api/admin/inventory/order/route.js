import {NextApiRequest, NextResponse} from "next/server";
import { InventoryOrders, Inventory, Blank, Items }from "@pythias/mongo";
import axios from "axios";
export async function GET(){
    let orders = await InventoryOrders.find({}).populate("locations.items.inventory")
    return NextResponse.json({error: false, orders})
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let printItems = []
    let order = await InventoryOrders.findById(data.id)
    if(order){
        let location = order.locations.filter(l=> l.name == data.location)[0]
        for(let i of location.items){
            let inv = await Inventory.findById(i.inventory)
            inv.quantity = inv.quantity + i.quantity
            console.log(inv.quantity, "quantity after adding back")
            //inv.pending_quantity = inv.pending_quantity - i.quantity
            let items = await Items.find({_id: {$in: order.items}, styleCode: inv.style_code, colorName: inv.color_name, sizeName: inv.size_name, labelPrinted: false }).populate("color", "name").populate("designRef", "sku name printType").lean().limit(i.quantity)
            //console.log(items.length)
            // items.map(i=>{
            //     i.inventory = inv
            //     return i
            // })
           //console.log(items)
            //printItems= printItems.concat(items)
            //console.log(inv)
           await inv.save()
        }
       // console.log(printItems.length)
        location.received = true
        try {
            //await axios.post("http://localhost:3009/api/production/print-labels", {items: printItems})
        } catch (error) { 
            console.log("Error printing labels:", error);
        }  
        //console.log(printLabels?.data)
        if(!order.locations.filter(l=> l.received == false)[0]) order.received = true
        order.markModified("locations received")
        await order.save()
    }
    let orders = await InventoryOrders.find({received: {$in: [null, false]}}).populate("locations.items.inventory")
    return NextResponse.json({error: false, orders })
}
export async function POST(req=NextApiRequest){
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
            inv.attached = inv.attached.filter(a => !location.items.map(i => i.inventory.toString()).includes(a.toString()))
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