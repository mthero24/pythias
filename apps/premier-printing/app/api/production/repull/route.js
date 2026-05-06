import { Bin, Items, RepullReasons, Blank, Inventory } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
export async function GET(){
    console.log("GET REASONS")
    let blanks = await Blank.find().populate("colors").select("code colors sizes")
    return NextResponse.json({ error: false, reasons: await RepullReasons.find(), blanks})
}
export async function POST(req=NextApiRequest){
    let data= await req.json()
    let item = await Items.findOne({pieceId: data.pieceId})
    if(item){
        if (data.reason == "Pulling Error" && data.blankCode && data.color && data.size) {
            let inv = await Inventory.findOne({ style_code: data.blankCode, "color_name": data.color, "size_name": data.size })
            if (inv && inv.quantity > 0) {
                inv.quantity -= 1
                await inv.save()
            }
            let inv2 = await Inventory.findOne({_id: item.inventory.inventory})
            if(inv2){
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
        await item.save()
        return NextResponse.json({error: false, msg: "Item Has Been Set To be Repulled!"})
    }else return NextResponse.json({error: true, msg: "Item not found"})
}