import { PlatformInventory as Inventory, PlatformBlank as Blanks, PlatformItem as Items } from "@pythias/mongo";
import { NextApiRequest, NextResponse } from "next/server";
import { getInv } from "@pythias/inventory"
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";

export async function GET(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let term = req.nextUrl.searchParams.get("q");
    let res = await getInv({ Blanks, Inventory, term, page: 1, orgId })
    return NextResponse.json({ ...res })
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const orgId = token?.orgId;
    if (token.permissions && token.permissions.inventory !== true) {
        return NextResponse.json({ error: true, msg: "You do not have permission to perform this action." }, { status: 200 })
    }
    let data = await req.json()
    let updateItems = []
    if (!data.inventory.attached) data.inventory.attached = [];
    if (data.inventory.quantity > 0 && data.inventory.attached?.length > 0) {
        const attachedSlice = data.inventory.attached.slice(0, data.inventory.quantity);
        const existingItems = await Items.find({ _id: { $in: attachedSlice }, orgId }).select("_id").lean();
        updateItems = existingItems.map(i => i._id.toString());
        if (updateItems.length > 0) {
            await Items.updateMany(
                { _id: { $in: updateItems }, orgId },
                { $set: { inventory: { inventoryType: "inventory", inventory: data.inventory._id, productInventory: null } } }
            );
        }
    }
    let removedItems = []
    if (!data.inventory.inStock) data.inventory.inStock = [];
    if (data.inventory.quantity < data.inventory.inStock.length) {
        let items = await Items.find({ _id: { $in: data.inventory.inStock }, orgId }).sort({ _id: 1 });
        for (let i = 0; i < data.inventory.quantity; i++) {
            removedItems.push(items[i]?._id)
            data.inventory.attached.push(items[i]?._id)
        }
        data.inventory.inStock = data.inventory.inStock.filter(i => !removedItems.includes(i));
    }
    data.inventory.attached = data.inventory.attached.filter(a => !updateItems.includes(a));
    if (!data.inventory.inStock) {
        data.inventory.inStock = []
    }
    data.inventory.inStock = [...data.inventory.inStock, ...updateItems];
    await Inventory.findOneAndUpdate({ _id: data.inventory._id, orgId }, data.inventory).catch(e => { console.log(e) });
    logActivity({ action: "inventory_update", entity: "inventory", entityId: data.inventory._id, entityName: `${data.inventory.style_code} ${data.inventory.color_name} ${data.inventory.size_name}`, userName, email });
    return NextResponse.json({ error: false, inventory: data.inventory })
}

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json()
    await Inventory.findOneAndDelete({ inventory_id: data.inventory_id, orgId });
    return NextResponse.json({ error: false })
}

export async function DELETE(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let id = req.nextUrl.searchParams.get("id");
    await Inventory.findOneAndDelete({ _id: id, orgId });
    let term = req.nextUrl.searchParams.get("q");
    let page = req.nextUrl.searchParams.get("page");
    let res = await getInv({ Blanks, Inventory, term, page: Number(page), orgId });
    return NextResponse.json({ ...res })
}
