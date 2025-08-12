import {Inventory, Blank as Blanks, Items }from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import {getInv} from "@pythias/inventory"
export async function GET(req=NextApiRequest){
    let term = req.nextUrl.searchParams.get("q");
    let res = await getInv({ Blanks, Inventory, term, page: 1})
    return NextResponse.json({...res})
}

export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let inv = await Inventory.findByIdAndUpdate(data.inventory._id, data.inventory, { new: true, returnNewDocument: true }).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus").lean().catch(e => { console.log(e) });
    inv = await Inventory.findById(data.inventory._id).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus").lean().catch(e => { console.log(e) });

    return NextResponse.json({ error: false, inventory: data.inventory })
}
export async function PUT(req=NextApiRequest){
    console.log("here")
    let data = await req.json()
    let inventory = await Inventory.findOneAndDelete({inventory_id: data.inventory_id});
    return NextResponse.json({error: false})
}