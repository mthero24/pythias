import {Inventory, Items} from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    await Inventory.findByIdAndUpdate(data.inventory._id, data.inventory);
    let items = await Items.find({labelPrinted: false, status: "awaiting_shipment"})
    return NextResponse.json({error: false, items})
}
export async function PUT(req=NextApiRequest){
    console.log("here")
    let data = await req.json()
    let inventory = await Inventory.findOneAndDelete({inventory_id: data.inventory_id});
    return NextResponse.json({error: false})
}