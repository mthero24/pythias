import { NextApiRequest, NextResponse } from "next/server";
import { InventoryOrders, Inventory, Blank } from "@pythias/mongo";
import TspItems from "@/models/Items";
import { Sort } from "@pythias/labels";
import axios from "axios";
import { getToken } from "next-auth/jwt";
import { logChange, userFromToken } from "@pythias/backend/server";

export async function GET(req) {
    const all = req.nextUrl.searchParams.get("all") === "true";

    if (all) {
        const q    = req.nextUrl.searchParams.get("q") || "";
        const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");
        const filter = q
            ? { $or: [{ poNumber: { $regex: q, $options: "i" } }, { vendor: { $regex: q, $options: "i" } }] }
            : {};
        const [orders, total] = await Promise.all([
            InventoryOrders.find(filter).sort({ _id: -1 }).skip(skip).limit(50).populate("locations.items.inventory"),
            InventoryOrders.countDocuments(filter),
        ]);
        return NextResponse.json({ error: false, orders, total });
    }

    const orders = await InventoryOrders.find({ received: { $ne: true } }).populate("locations.items.inventory");

    // Fire-and-forget: backfill stockStatus for items already on open orders
    ;(async () => {
        try {
            const openOrderIds = orders.map(o => o._id);
            const invDocs = await Inventory.find({ "orders.order": { $in: openOrderIds } }, "orders").lean();
            const itemIds = invDocs.flatMap(inv =>
                (inv.orders || [])
                    .filter(o => openOrderIds.some(id => id.toString() === o.order.toString()))
                    .flatMap(o => o.items || [])
            );
            if (itemIds.length > 0) {
                TspItems.updateMany(
                    { _id: { $in: itemIds }, stockStatus: "attached" },
                    { $set: { stockStatus: "ordered" } }
                ).catch(() => {});
            }
        } catch {}
    })();

    return NextResponse.json({ error: false, orders });
}

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    let printItems = [];
    let order = await InventoryOrders.findById(data.id);
    if (order) {
        try {
            let location = order.locations.filter(l => l.name == data.location)[0];
            for (let i of location.items) {
                let itemsToPrint = [];
                let inv = await Inventory.findById(i.inventory);
                inv.quantity = inv.quantity + i.quantity;
                inv.pending_quantity = inv.pending_quantity - i.quantity;
                if (inv.orders) {
                    const or = inv.orders.filter(o => o.order.toString() == order._id.toString());
                    for (let o of or) {
                        if (!o) continue;
                        let items;
                        if (o.items && o.items.length > 0) {
                            items = await TspItems.find({ _id: { $in: o.items } })
                                .populate("design inventory.inventory")
                                .populate("order", "poNumber items")
                                .sort({ date: 1 });
                        } else {
                            // No items pre-linked at order creation — find FIFO ordered items for this inventory
                            items = await TspItems.find({
                                stockStatus: "ordered",
                                "inventory.inventory": inv._id,
                                canceled: false,
                                paid: true,
                                labelPrinted: false,
                            })
                                .populate("design inventory.inventory")
                                .populate("order", "poNumber items")
                                .sort({ date: 1 })
                                .limit(i.quantity);
                        }

                        items = items.filter(it => !itemsToPrint.map(x => x._id.toString()).includes(it._id.toString()));
                        const toPrint = items.filter(it => !it.labelPrinted && !it.bulkId).slice(0, i.quantity);
                        const bulkToReceive = items.filter(it => !it.labelPrinted && it.bulkId);
                        itemsToPrint.push(...toPrint);

                        const toMarkInStock = [...toPrint, ...bulkToReceive];
                        if (toMarkInStock.length > 0) {
                            await TspItems.bulkWrite(
                                toMarkInStock.map(it => ({ updateOne: { filter: { _id: it._id }, update: { $set: { stockStatus: "inStock" } } } })),
                                { ordered: false }
                            );
                            inv.allocated = (inv.allocated ?? 0) + toPrint.length;
                        }
                    }
                }
                inv.orders = inv.orders.filter(o => o.order.toString() != order._id.toString());
                printItems.push(...itemsToPrint);
                await inv.save();
            }
            location.received = true;
            printItems = Sort(printItems, "PO");
            let printLabels = await axios.post("https://production.printoracle.com/api/production/print-labels", { items: Sort(printItems, "PO"), poNumber: order.poNumber });
            console.log(printLabels?.data);
            if (order.locations.filter(l => l.received == false).length == 0) order.received = true;
            order.markModified("locations received");
            await order.save();
            logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "receive", userName, email, provider: "po" });
            let orders = await InventoryOrders.find({ received: { $ne: true } }).populate("locations.items.inventory");
            return NextResponse.json({ error: false, orders });
        } catch (e) {
            console.log(e);
            return NextResponse.json({ error: true, msg: "Something went wrong marking order received" });
        }
    }
}

export async function POST(req = NextApiRequest) {
    const t0 = Date.now();
    const elapsed = () => `${Date.now() - t0}ms`;
    console.log("[inventory/order POST] start");
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data = await req.json();
    console.log(`[inventory/order POST] body +${elapsed()}`, { poNumber: data.order?.poNumber, company: data.order?.company, needsOrderedCount: data.needsOrdered?.length, itemsCount: data.items?.length });
    let order = new InventoryOrders({
        vendor: data.order.company,
        poNumber: data.order.poNumber,
        dateOrdered: new Date(data.order.dateOrdered + "T12:00:00"),
        dateExpected: data.order.dateExpected ? new Date(data.order.dateExpected + "T12:00:00") : null,
        locations: [],
        items: data.items,
    });

    let locations = [];
    for (let i of data.needsOrdered) {
        if (!locations.includes(i.location)) locations.push(i.location);
    }
    console.log(`[inventory/order POST] locations +${elapsed()}`, locations, "included items", data.needsOrdered?.filter(i => i.included).length);

    for (let loc of locations) {
        let items = [];
        for (let i of data.needsOrdered) {
            if (i.location == loc && i.included) {
                items.push({ inventory: i.inv._id, quantity: i.order });

                console.log(`[inventory/order POST] Inventory.findById +${elapsed()}`, i.inv._id);
                let inv = await Inventory.findById(i.inv._id);
                console.log(`[inventory/order POST] inv found +${elapsed()}`, !!inv, inv?.style_code, inv?.color_name);
                inv.pending_quantity += i.order;

                // Find the oldest attached items for this inventory (FIFO), up to ordered quantity
                console.log(`[inventory/order POST] TspItems.find attached +${elapsed()}`, inv._id);
                const attachedItems = await TspItems.find({
                    stockStatus: "attached",
                    "inventory.inventory": inv._id,
                    canceled: false,
                    paid: true,
                }).sort({ date: 1 }).limit(i.order).select("_id");
                console.log(`[inventory/order POST] attachedItems +${elapsed()}`, attachedItems.length);

                if (!inv.orders) inv.orders = [];
                inv.orders.push({
                    order: order._id,
                    quantity: i.order,
                    items: attachedItems.map(it => it._id),
                });

                // Move TSPprints attached → ordered
                if (attachedItems.length > 0) {
                    await TspItems.bulkWrite(
                        attachedItems.map(it => ({ updateOne: { filter: { _id: it._id }, update: { $set: { stockStatus: "ordered" } } } })),
                        { ordered: false }
                    );
                    inv.attachedCount = Math.max(0, (inv.attachedCount ?? 0) - attachedItems.length);
                }

                console.log(`[inventory/order POST] inv.save +${elapsed()}`, inv._id);
                await inv.save();
            }
        }
        order.locations.push({ name: loc, received: false, items });
    }

    console.log(`[inventory/order POST] order.save +${elapsed()}`, order._id);
    await order.save();
    console.log(`[inventory/order POST] done +${elapsed()}`);
    logChange({ entityType: "inventory_order", entityId: order._id, entityName: order.poNumber || "", action: "create", userName, email, provider: "po" });
    return NextResponse.json({ error: false });
}
