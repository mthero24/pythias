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
    let updateItems = []
    if (data.inventory.quantity > 0 && data.inventory.attached.length > 0) {
        for (let i = 0; i < data.inventory.quantity; i++) {
            let item = await Items.findOne({ _id: data.inventory.attached[i] })
            if (item) {
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
    }
    let removedItems = []
    if(data.inventory.quantity < data.inventory.inStock.length){
        let items = await Items.find({_id: {$in: data.inventory.inStock}}).sort({_id: 1});
        for(let i = 0; i < data.inventory.quantity; i++){
            removedItems.push(items[i]?._id)
            data.inventory.attached.push(items[i]?._id)  
        }
        data.inventory.inStock = data.inventory.inStock.filter(i => !removedItems.includes(i));

    }
    console.log(updateItems.length, "updateItems in POST inventory route")
    data.inventory.attached = data.inventory.attached.filter(a => !updateItems.includes(a));
    if (!data.inventory.inStock) {
        data.inventory.inStock = []
    }
    data.inventory.inStock = [...data.inventory.inStock, ...updateItems];
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

export async function DELETE(req=NextApiRequest){
    let id = req.nextUrl.searchParams.get("id");
    console.log("Deleting inventory with id:", id);
    let inventory = await Inventory.findOneAndDelete({_id: id});
    let term = req.nextUrl.searchParams.get("q");
    let page = req.nextUrl.searchParams.get("page");
    console.log(term, req.nextUrl.searchParams.get("q"),  page, "term and page in delete inventory route");
    let res = await getInv({ Blanks, Inventory, term, page: Number(page) });
    return NextResponse.json({...res})
}