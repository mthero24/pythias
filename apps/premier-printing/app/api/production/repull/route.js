import { Bin, Items, RepullReasons } from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
export async function GET(){
    console.log("GET REASONS")
    return NextResponse.json({ error: false, reasons: await RepullReasons.find()})
}
export async function POST(req=NextApiRequest){
    let data= await req.json()
    let item = await Items.findOne({pieceId: data.pieceId})
    if(item){
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