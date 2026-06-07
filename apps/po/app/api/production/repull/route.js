import Items from "../../../../models/Items";
import Bin from "../../../../models/Bin";
import StyleV2 from "../../../../models/StyleV2";
import { Inventory, InventoryOrders, RepullReasons } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";
export async function GET(){
    const [reasons, blanks] = await Promise.all([
        RepullReasons.find(),
        StyleV2.find({ active: { $ne: false } }, "code sizes colors")
            .populate("colors", "name")
            .lean(),
    ]);
    return NextResponse.json({ error: false, reasons, blanks });
}
export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    let data= await req.json()
    let item = await Items.findOne({pieceId: data.pieceId})
    if(item){
        item.labelPrinted = false
        item.inBin = false
        item.printed = false
        item.folded = false
        item.rePulled = true,
        item.shipped = false,
        item.steps.push({ status: "Re-Pulled", date: new Date() })
        item.rePulledTimes = (item.rePulledTimes || 0) + 1;
        if(!item.rePulledReasons) item.rePulledReasons = []
        item.rePulledReasons.push(data.reason)
        let bin = await Bin.findOne({order: item.order})
        if(bin){
            bin.items = bin.items.filter(i=> i.toString() != item._id.toString())
            bin.ready = false
            await bin.save()
        }
        const invId = item.inventory?.inventory
            || (await Inventory.findOne({ inventory_id: encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`) }, "_id").lean())?._id;
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
        logActivity({ action: "item_repull", entity: "order", entityId: item.order, entityName: item.pieceId || "", userName, email, provider: "po" });
        if (data.reason === "Pulling Error") {
            logChange({ entityType: "item", entityId: item._id, entityName: item.pieceId, action: "repull", userName, email, provider: "po" });
        }
        return NextResponse.json({error: false, msg: "Item Has Been Set To be Repulled!"})
    }else return NextResponse.json({error: true, msg: "Item not found"})
}