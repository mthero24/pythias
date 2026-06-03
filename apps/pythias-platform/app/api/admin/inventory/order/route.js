import { NextApiRequest, NextResponse } from "next/server"
import { PlatformBlank as Blanks, PlatformItem as Items, PlatformInventory as Inventory, PlatformInventoryOrder as InventoryOrders } from "@pythias/mongo";
import axios from "axios";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";

export async function GET(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let orders = await InventoryOrders.find({ orgId, received: false }).populate("locations.items.inventory")
    return NextResponse.json({ error: false, orders })
}

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    let data = await req.json()
    let printItems = []
    let order = await InventoryOrders.findOne({ _id: data.id, orgId })
    if (order) {
        let location = order.locations.filter(l => l.name == data.location)[0]
        for (let i of location.items) {
            let itemsToPrint = []
            let inv = await Inventory.findOne({ _id: i.inventory, orgId })
            inv.quantity = inv.quantity + i.quantity
            inv.pending_quantity = inv.pending_quantity - i.quantity
            if (inv.orders) {
                let o = inv.orders.filter(o => o.order.toString() == order._id.toString())[0]
                let items = await Items.find({ _id: { $in: o?.items }, orgId }).populate("designRef inventory.inventory").sort({ _id: 1 })
                itemsToPrint.push(...items)
            }
            inv.orders = inv.orders.filter(o => o.order.toString() != order._id.toString())
            printItems.push(...itemsToPrint)
            await inv.save()
        }
        location.received = true
        let printLabels = await axios.post("https://simplysage.pythiastechnologies.com/api/production/print-labels", { items: printItems, poNumber: order.poNumber })
        console.log(printLabels?.data)
        if (order.locations.filter(l => l.received == false).length == 0) order.received = true
        order.markModified("locations received")
        await order.save()
        logActivity({ action: "inventory_order_receive", entity: "inventory_order", entityId: order._id, entityName: order.poNumber || "", userName, email });
        logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "receive", userName, email });
    }
    let orders = await InventoryOrders.find({ orgId, received: { $in: [null, false] } }).populate("locations.items.inventory")
    return NextResponse.json({ error: false, orders })
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    let data = await req.json()
    let order = new InventoryOrders({ orgId, vendor: data.order.company, poNumber: data.order.poNumber, dateOrdered: new Date(data.order.dateOrdered + "T12:00:00"), dateExpected: data.order.dateExpected ? new Date(data.order.dateExpected + "T12:00:00") : null, locations: [], items: data.items })
    let locations = []
    for (let i of data.needsOrdered) {
        if (!locations.includes(i.location)) locations.push(i.location)
    }
    for (let loc of locations) {
        let items = []
        for (let i of data.needsOrdered) {
            if (i.location == loc && i.included) {
                items.push({
                    inventory: i.inv._id,
                    quantity: i.order
                })
                let inv = await Inventory.findOne({ _id: i.inv._id, orgId })
                inv.pending_quantity += i.order
                let it = await Items.find({ _id: { $in: inv.attached }, orgId }).sort({ _id: 1 })
                if (it.length > i.order) {
                    it = it.slice(0, i.order)
                }
                if (!inv.orders) inv.orders = []
                inv.orders.push({
                    order: order._id,
                    quantity: i.order,
                    items: it.map(i => i._id)
                })
                inv.attached = inv.attached.filter(a => !it.map(i => i._id.toString()).includes(a.toString()))
                await inv.save()
            }
        }
        if (items.length > 0) {
            order.locations.push({
                name: loc,
                received: false,
                items
            })
        }
    }
    await order.save()
    logActivity({ action: "inventory_order_create", entity: "inventory_order", entityId: order._id, entityName: order.poNumber || "", userName, email });
    logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "create", userName, email });
    let inventory = await Inventory.find({ orgId }).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location")
    let blanks = await Blanks.find({ orgId }).populate("colors").select("code name colors sizes department")
    let combined = []
    for (let blank of blanks) {
        blank.inventory = inventory.filter(i => i.blank.toString() == blank._id.toString())
        combined.push({ blank, inventories: blank.inventory })
    }
    return NextResponse.json({ error: false, combined, items: [] })
}
