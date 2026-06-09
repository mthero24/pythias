import { NextApiRequest, NextResponse } from "next/server"
import { Items, SkuToUpc, Order, Inventory, InventoryOrders } from "@pythias/mongo";

const recomputeForInventory = async (invId) => {
    const [inv, linkedItems, activeOrders] = await Promise.all([
        Inventory.findById(invId, "quantity").lean(),
        Items.find({ "inventory.inventory": invId, labelPrinted: false, canceled: false, shipped: false, paid: true })
            .select("_id stockStatus date").sort({ date: 1 }).lean(),
        InventoryOrders.find({ received: { $ne: true }, "locations.items.inventory": invId }, "locations").lean(),
    ]);
    if (!linkedItems.length) return;
    const quantity = Math.max(0, inv?.quantity ?? 0);
    let orderedCap = 0;
    for (const po of activeOrders) {
        for (const loc of po.locations ?? []) {
            if (loc.received) continue;
            for (const li of loc.items ?? []) {
                if (li.inventory?.toString() === invId.toString()) orderedCap += li.quantity ?? 0;
            }
        }
    }
    let slotsUsed = 0, orderedUsed = 0;
    const ops = [];
    for (const item of linkedItems) {
        let computed;
        if (slotsUsed < quantity)          { computed = "inStock";  slotsUsed++; }
        else if (orderedUsed < orderedCap) { computed = "ordered";  orderedUsed++; }
        else                               { computed = "attached"; }
        if (item.stockStatus !== computed)
            ops.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: computed } } } });
    }
    if (ops.length) await Items.bulkWrite(ops, { ordered: false });
};
export async function PUT(req = NextApiRequest) {
    let data = await req.json()
    console.log(data.item)
    if(data.item.isBlank && data.item.design) data.item.isBlank = false
    let item = await Items.findOneAndUpdate({ _id: data.item._id }, { ...data.item }, { new: true }).populate("blank color")
    //console.log("here", item.design, Object.keys(item.design), Object.keys(item.design).length, !item.design && Object.keys(item.design).length == 0)
    let sku = await SkuToUpc.findOne({ sku: item.sku })
    if (sku) {
        sku.blank = item.blank
        sku.design = item.designRef
        sku.color = item.color
        sku.size = item.sizeName
        await sku.save()
    }
    console.log(item.inventory?.inventoryType, item.blank.code, item.color?.name, item?.sizeName)
    if (!item.inventory?.inventoryType && item.blank && item.color && item.sizeName) {
        let size = item.blank.sizes.filter(s => s._id.toString() == item.size.toString())[0]
        let inv = await Inventory.findOne({ blank: item.blank._id, color: item.color?._id, sizeId: size?._id })
        if(!inv) inv = await Inventory.findOne({ style_code: item.styleCode, color_name: item.colorName, size_name: item.sizeName, })
        if (inv) {
            item.inventory = { inventoryType: "inventory", inventory: inv._id, productInventory: null }
            if (inv.quantity > 0 && inv.quantity > inv.inStock.length) {
                inv.inStock.push(item._id.toString())
                item.stockStatus = "inStock"
                await inv.save()
            } else {
                inv.attached.push(item._id.toString())
                item.stockStatus = "attached"
                await inv.save()
            }
            item = await item.save()
        }
    } else if (item.inventory?.inventory) {
        recomputeForInventory(item.inventory.inventory); // fire-and-forget
    }
    let order = await Order.findOne({ _id: item.order }).populate("items").lean()
    return NextResponse.json({ error: false, order })
}