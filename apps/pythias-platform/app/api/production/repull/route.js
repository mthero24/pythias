import { PlatformBin as Bin, PlatformItem as Items, RepullReasons, PlatformBlank as Blank, PlatformInventory as Inventory } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, logChange, userFromToken } from "@pythias/backend/server";
export async function GET(req){
    const token = await getToken({ req });
    const orgId = token?.orgId;
    console.log("GET REASONS")
    let blanks = await Blank.find({ orgId }).populate("colors").select("code colors sizes")
    return NextResponse.json({ error: false, reasons: await RepullReasons.find(), blanks})
}
export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    let data= await req.json()
    let item = await Items.findOne({pieceId: data.pieceId, orgId})
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
        let bin = await Bin.findOne({order: item.order, orgId})
        if(bin){
            bin.items = bin.items.filter(i=> i.toString() != item._id.toString())
            bin.ready = false
            await bin.save()
        }
        await item.save()
        logActivity({ action: "item_repull", entity: "order", entityId: item.order, entityName: item.pieceId || "", userName, email });
        if (data.reason === "Pulling Error") {
            logChange({ entityType: "item", entityId: item._id, entityName: item.pieceId, action: "repull", userName, email, provider: "premierPrinting" });
        }
        return NextResponse.json({error: false, msg: "Item Has Been Set To be Repulled!"})
    }else return NextResponse.json({error: true, msg: "Item not found"})
}