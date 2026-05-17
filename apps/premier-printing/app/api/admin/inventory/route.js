import {Inventory, Blank as Blanks, Items }from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import {getInv} from "@pythias/inventory"
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
export async function GET(req=NextApiRequest){
    let term = req.nextUrl.searchParams.get("q");
    let res = await getInv({ Blanks, Inventory, term, page: 1})
    return NextResponse.json({...res})
}

export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    console.log(token, "token")
    if(token.permissions && token.permissions.inventory !== true){
        return NextResponse.json({error: true, msg: "You do not have permission to perform this action."}, {status: 200})
    }
    let data = await req.json()
    let updateItems = []
    if(!data.inventory.attached) data.inventory.attached = [];
    if (data.inventory.quantity > 0 && data.inventory.attached?.length > 0) {
        const attachedSlice = data.inventory.attached.slice(0, data.inventory.quantity);
        const existingItems = await Items.find({ _id: { $in: attachedSlice } }).select("_id").lean();
        updateItems = existingItems.map(i => i._id.toString());
        if (updateItems.length > 0) {
            await Items.updateMany(
                { _id: { $in: updateItems } },
                { $set: { inventory: { inventoryType: "inventory", inventory: data.inventory._id, productInventory: null } } }
            );
        }
    }
    let removedItems = []
    if(!data.inventory.inStock) data.inventory.inStock = [];
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
    await Inventory.findByIdAndUpdate(data.inventory._id, data.inventory).catch(e => { console.log(e) });
    logActivity({ action: "inventory_update", entity: "inventory", entityId: data.inventory._id, entityName: `${data.inventory.style_code} ${data.inventory.color_name} ${data.inventory.size_name}`, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ error: false, inventory: data.inventory })
}
export async function PUT(req=NextApiRequest){
    const token = await getToken({ req });
    console.log(token, "token")
    console.log("here")
    let data = await req.json()
    let inventory = await Inventory.findOneAndDelete({inventory_id: data.inventory_id});
    return NextResponse.json({error: false})
}

export async function DELETE(req=NextApiRequest){
    const token = await getToken({ req });
    console.log(token, "token")
    let id = req.nextUrl.searchParams.get("id");
    console.log("Deleting inventory with id:", id);
    let inventory = await Inventory.findOneAndDelete({_id: id});
    let term = req.nextUrl.searchParams.get("q");
    let page = req.nextUrl.searchParams.get("page");
    console.log(term, req.nextUrl.searchParams.get("q"),  page, "term and page in delete inventory route");
    let res = await getInv({ Blanks, Inventory, term, page: Number(page) });
    return NextResponse.json({...res})
}