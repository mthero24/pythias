import Items from "../../../../models/Items";
import Bin from "../../../../models/Bin";
import StyleV2 from "../../../../models/StyleV2";
import { Inventory, RepullReasons } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import inventory from "@/models/inventory";
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
        let inv = item.inventory?.inventory ? await Inventory.findOne({ _id: item.inventory.inventory }) : null;
        if (!inv) inv = await Inventory.findOne({ inventory_id: encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`) });
        if (inv) {
            if(inv.quantity > 0 && inv.inStock.length < inv.quantity){
                inv.inStock.push(item._id.toString())
            } else {
                inv.attached.push(item._id.toString())
            }
            await inv.save()
        }
        await item.save()
        logActivity({ action: "item_repull", entity: "order", entityId: item.order, entityName: item.pieceId || "", userName, email, provider: "po" });
        if (data.reason === "Pulling Error") {
            logChange({ entityType: "item", entityId: item._id, entityName: item.pieceId, action: "repull", userName, email, provider: "po" });
        }
        return NextResponse.json({error: false, msg: "Item Has Been Set To be Repulled!"})
    }else return NextResponse.json({error: true, msg: "Item not found"})
}