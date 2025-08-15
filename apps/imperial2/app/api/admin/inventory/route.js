import {Inventory, Items, Blank as Blanks} from "@pythias/mongo";
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
    let updateItems = []
    if(data.inventory.quantity > 0 && data.inventory.attached.length > 0){
        for(let i = 0; i < data.inventory.quantity; i++){
            let item = await Items.findOne({_id: data.inventory.attached[i]})
            item.inventory = {
                inventoryType: "inventory",
                inventory: data.inventory._id,
                productInventory: null,
            }
            await item.save()
            //console.log(item, "item in POST inventory route")
            updateItems.push(data.inventory.attached[i])
        }
    }
    console.log(updateItems.length, "updateItems in POST inventory route")
    data.inventory.quantity = data.inventory.quantity - updateItems.length;
    data.inventory.attached = data.inventory.attached.filter(a => !updateItems.includes(a));
    console.log(data.inventory.attached, data.inventory.quantity, "data.inventory in POST inventory route")
    let inv = await Inventory.findByIdAndUpdate(data.inventory._id, data.inventory, {new: true, returnNewDocument: true}).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus").lean().catch(e=>{console.log(e)});
    inv = await Inventory.findById(data.inventory._id).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus").lean().catch(e=>{console.log(e)});
   
    return NextResponse.json({error: false, inventory: data.inventory})
}
export async function PUT(req=NextApiRequest){
    console.log("here")
    let data = await req.json()
    let inventory = await Inventory.findOneAndDelete({inventory_id: data.inventory_id});
    return NextResponse.json({error: false})
}