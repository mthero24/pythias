import { Bin, Items, RepullReasons, Blank, Inventory, InventoryOrders, Order } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";
export async function GET(){
    console.log("GET REASONS")
    let blanks = await Blank.find().populate("colors").select("code colors sizes")
    return NextResponse.json({ error: false, reasons: await RepullReasons.find(), blanks})
}
export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data= await req.json()
    let item = await Items.findOne({pieceId: data.pieceId})
    console.log(item, "item to repull", data.blank, data.color, data.size)
    if(item){
        if (data.reason == "Pulling Error" && data.blank && data.color && data.size) {
            let inv = await Inventory.findOne({ style_code: data.blank, "color_name": data.color, "size_name": data.size })
            console.log(inv, "inventory for repull")
            if (inv && inv.quantity > 0) {
                inv.quantity -= 1
                await inv.save()
            }
            let inv2 = await Inventory.findOne({_id: item.inventory.inventory})
            if(inv2){
                console.log(inv2, "inventory for repull 2")
                inv2.quantity += 1
                await inv2.save()
            }
        }
        item.labelPrinted = false
        item.inBin = false
        item.printed = false
        item.folded = false
        item.rePulled = true,
        item.shipped = false,
        item.steps = []
        item.rePulledTimes++
        if(!item.rePulledReasons) item.rePulledReasons = []
        item.rePulledReasons.push(data.reason)
        let bin = await Bin.findOne({order: item.order})
        if(bin){
            bin.items = bin.items.filter(i=> i.toString() != item._id.toString())
            bin.ready = false
            await bin.save()
        }
        const invId = item.inventory?.inventory;
        if (invId) {
            const inv = await Inventory.findOne({ _id: invId }, "quantity allocated").lean();
            if (inv) {
                const quantity = Math.max(0, inv.quantity ?? 0);
                const wasInStock = item.stockStatus === "inStock";
                const otherAllocated = wasInStock ? Math.max(0, (inv.allocated ?? 0) - 1) : (inv.allocated ?? 0);
                if (otherAllocated < quantity) {
                    item.stockStatus = "inStock";
                    if (!wasInStock) await Inventory.updateOne({ _id: invId }, { $inc: { allocated: 1 } });
                } else {
                    if (wasInStock) await Inventory.updateOne({ _id: invId }, { $inc: { allocated: -1 } });
                    const pending = await InventoryOrders.aggregate([
                        { $match: { received: { $ne: true }, "locations.items.inventory": invId } },
                        { $unwind: "$locations" },
                        { $match: { "locations.received": { $ne: true } } },
                        { $unwind: "$locations.items" },
                        { $match: { "locations.items.inventory": invId } },
                        { $group: { _id: null, total: { $sum: "$locations.items.quantity" } } },
                    ]);
                    const orderedCap = pending[0]?.total ?? 0;
                    const orderedUsed = await Items.countDocuments({ "inventory.inventory": invId, stockStatus: "ordered", canceled: false, shipped: false });
                    item.stockStatus = orderedUsed < orderedCap ? "ordered" : "attached";
                }
            }
        }
        await item.save()
        // Repulling a piece means it's going back through production, so the order is no longer fully
        // shipped. If it was marked shipped (auto-shipped at the folder station, or otherwise), reset
        // it to awaiting_shipment so it re-enters the ship workflow — otherwise the order reads
        // "Shipped" while the piece sits unshipped in production (the shipped-but-unmarked desync).
        const order = await Order.findOne({ _id: item.order });
        if (order) {
            const wasShipped = order.preShipped || order.shipped || /shipped/i.test(order.status || "");
            if (wasShipped) {
                order.status = "awaiting_shipment";
                order.shipped = false;
                order.preShipped = false;
                await order.save();
            }
        }
        logActivity({ action: "item_repull", entity: "order", entityId: item.order, entityName: item.pieceId || "", userName, email });
        if (data.reason === "Pulling Error") {
            logChange({ entityType: "item", entityId: item._id, entityName: item.pieceId, action: "repull", userName, email, provider: "premierPrinting" });
        }
        return NextResponse.json({error: false, msg: "Item Has Been Set To be Repulled!"})
    }else return NextResponse.json({error: true, msg: "Item not found"})
}