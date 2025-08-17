import {Inventory} from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import {default as Blanks} from "@/models/StyleV2";
import Items from "@/models/Items";
import {getInv} from "@pythias/inventory"
export async function GET(req=NextApiRequest){
    let term = req.nextUrl.searchParams.get("q");
    let res = await getInv({ Blanks, Inventory, term, page: 1})
    return NextResponse.json({...res})
}
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