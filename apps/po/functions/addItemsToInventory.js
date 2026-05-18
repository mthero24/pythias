import {Inventory} from "@pythias/mongo";
import Items from "@/models/Items";
import Order from "@/models/Order";

const updateInventory = async () => {
    // Single query for all active items across all inventories
    const activeItems = await Items.find({
        "inventory.inventory": { $exists: true, $ne: null },
        labelPrinted: false, canceled: false, shipped: false, paid: true,
    }).select("_id inventory.inventory").lean();

    const itemsByInvId = {};
    for (const item of activeItems) {
        const invId = String(item.inventory?.inventory);
        if (!itemsByInvId[invId]) itemsByInvId[invId] = [];
        itemsByInvId[invId].push(String(item._id));
    }

    const inventories = await Inventory.find({}).lean();
    const ops = [];

    for (const inv of inventories) {
        const itemIds = itemsByInvId[String(inv._id)] || [];
        const quantity = Math.max(inv.quantity || 0, 0);

        // O(1) lookup instead of repeated .flat().includes()
        const orderedIds = new Set((inv.orders || []).flatMap(o => (o.items || []).map(i => String(i))));

        const inStock = [];
        const attached = [];
        for (const itemId of itemIds) {
            if (orderedIds.has(itemId)) continue;
            if (quantity - inStock.length > 0) {
                inStock.push(itemId);
            } else {
                attached.push(itemId);
            }
        }

        ops.push({
            updateOne: {
                filter: { _id: inv._id },
                update: { $set: { quantity, inStock, attached } },
            },
        });
    }

    if (ops.length) await Inventory.bulkWrite(ops, { ordered: false });
};

export async function addItemsToInventory() {
    console.log("Adding items to inventory...");
    const items = await Items.find({
        labelPrinted: false,
        "inventory.inventory": { $eq: null },
        order: { $ne: null },
        canceled: false, shipped: false, paid: true,
    }).select("_id order colorName sizeName styleCode").lean();

    if (!items.length) return;

    // Verify orders exist with one query instead of N individual lookups
    const orderIds = [...new Set(items.map(i => i.order?.toString()).filter(Boolean))];
    const existingOrders = await Order.find({ _id: { $in: orderIds } }, "_id").lean();
    const validOrderIds = new Set(existingOrders.map(o => o._id.toString()));

    const toCancel = items.filter(i => !validOrderIds.has(i.order?.toString()));
    const toAssign = items.filter(i =>  validOrderIds.has(i.order?.toString()));

    if (toCancel.length) {
        await Items.updateMany({ _id: { $in: toCancel.map(i => i._id) } }, { $set: { canceled: true } });
    }

    console.log(`${toAssign.length} items to add to inventory`);
    if (!toAssign.length) return updateInventory();

    // Deduplicate inventory lookups — many items share the same style/color/size
    const uniqueKeys = [...new Set(toAssign.map(i => `${i.colorName}-${i.sizeName}-${i.styleCode}`))];
    const invResults = await Promise.all(
        uniqueKeys.map(key => Inventory.findOne({ inventory_id: encodeURIComponent(key) }, "_id").lean())
    );
    const invByKey = Object.fromEntries(uniqueKeys.map((k, idx) => [k, invResults[idx]?._id ?? null]));

    const itemOps = toAssign
        .map(item => {
            const invId = invByKey[`${item.colorName}-${item.sizeName}-${item.styleCode}`];
            if (!invId) return null;
            return {
                updateOne: {
                    filter: { _id: item._id },
                    update: { $set: { inventory: { inventoryType: "inventory", inventory: invId, productInventory: null } } },
                },
            };
        })
        .filter(Boolean);

    if (itemOps.length) await Items.bulkWrite(itemOps, { ordered: false });
    await updateInventory();
}

setInterval(() => {
    if(process.env.pm_id == 9 || process.env.pm_id == "9") addItemsToInventory();
}, 1000 * 60 * 15); // Run every 15 minutes