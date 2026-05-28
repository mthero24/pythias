import { Inventory } from "@pythias/mongo";
import Items from "@/models/Items";
import Order from "@/models/Order";

// Promote attached items (oldest first) into open slots when capacity is available
const promoteAttached = async () => {
    const attached = await Items.find({
        stockStatus: "attached",
        "inventory.inventory": { $exists: true, $ne: null },
        canceled: false, shipped: false, paid: true,
    }).select("_id inventory.inventory date").sort({ date: 1 }).lean();
    if (!attached.length) return;

    const byInv = {};
    for (const item of attached) {
        const k = item.inventory?.inventory?.toString();
        if (k) { if (!byInv[k]) byInv[k] = []; byInv[k].push(item._id); }
    }

    const inventories = await Inventory.find({ _id: { $in: Object.keys(byInv) } }, "quantity allocated").lean();
    const itemOps = [], invOps = [];

    for (const inv of inventories) {
        const available = Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0));
        if (!available) continue;
        const toPromote = byInv[inv._id.toString()].slice(0, available);
        toPromote.forEach(id => itemOps.push({ updateOne: { filter: { _id: id }, update: { $set: { stockStatus: "inStock" } } } }));
        invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $inc: { allocated: toPromote.length, attachedCount: -toPromote.length } } } });
    }

    await Promise.all([
        itemOps.length ? Items.bulkWrite(itemOps, { ordered: false }) : Promise.resolve(),
        invOps.length ? Inventory.bulkWrite(invOps, { ordered: false }) : Promise.resolve(),
    ]);
};

// Periodic reconciliation — corrects counter drift from crashes or edge cases
export const reconcileAllocated = async () => {
    const [inStockCounts, attachedCounts, allInvs] = await Promise.all([
        Items.aggregate([
            { $match: { stockStatus: "inStock", canceled: false, shipped: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
            { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
        ]),
        Items.aggregate([
            { $match: { stockStatus: "attached", canceled: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
            { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
        ]),
        Inventory.find({}, "_id").lean(),
    ]);
    const inStockMap = new Map(inStockCounts.map(r => [r._id.toString(), r.count]));
    const attachedMap = new Map(attachedCounts.map(r => [r._id.toString(), r.count]));
    const ops = allInvs.map(inv => ({
        updateOne: { filter: { _id: inv._id }, update: { $set: {
            allocated: inStockMap.get(inv._id.toString()) ?? 0,
            attachedCount: attachedMap.get(inv._id.toString()) ?? 0,
        } } },
    }));
    if (ops.length) await Inventory.bulkWrite(ops, { ordered: false });
    await promoteAttached();
};

export async function addItemsToInventory() {
    console.log("Adding items to inventory...");

    // Pick up ALL unallocated items: no inventory assigned OR inventory assigned but no stockStatus yet
    // Sort oldest first so FIFO slot assignment is guaranteed
    const items = await Items.find({
        labelPrinted: false,
        $or: [
            { "inventory.inventory": { $eq: null } },
            { stockStatus: { $in: [null, undefined] } },
        ],
        order: { $ne: null },
        canceled: false, shipped: false, paid: true,
    }).select("_id order colorName sizeName styleCode date inventory.inventory").sort({ date: 1 }).lean();

    if (!items.length) return promoteAttached();

    // Validate orders exist; cancel orphaned items
    const orderIds = [...new Set(items.map(i => i.order?.toString()).filter(Boolean))];
    const validOrderIds = new Set(
        (await Order.find({ _id: { $in: orderIds } }, "_id").lean()).map(o => o._id.toString())
    );

    const toCancel = items.filter(i => !validOrderIds.has(i.order?.toString()));
    const valid = items.filter(i => validOrderIds.has(i.order?.toString()));
    if (toCancel.length) await Items.updateMany({ _id: { $in: toCancel.map(i => i._id) } }, { $set: { canceled: true } });
    if (!valid.length) return promoteAttached();

    // Split: inventory already assigned (just needs stockStatus) vs. needs inventory lookup
    const hasInventory = valid.filter(i => i.inventory?.inventory);
    const needsInventory = valid.filter(i => !i.inventory?.inventory);

    // --- Group 1: inventory assigned, stockStatus missing ---
    if (hasInventory.length) {
        const invIds = [...new Set(hasInventory.map(i => i.inventory.inventory.toString()))];
        const invDocs = await Inventory.find({ _id: { $in: invIds } }, "quantity allocated orders").lean();
        const invMap = new Map(invDocs.map(inv => {
            const orderedItemIds = new Set((inv.orders || []).flatMap(o => (o.items || []).map(String)));
            const poSlotsRemaining = (inv.orders || []).reduce(
                (sum, o) => sum + Math.max(0, (o.quantity ?? 0) - (o.items || []).length), 0
            );
            return [inv._id.toString(), {
                available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)),
                orderedItemIds,
                poSlotsRemaining,
                slotsUsed: 0, attachedAdded: 0,
            }];
        }));

        const itemOps = [];
        for (const item of hasInventory) {
            const data = invMap.get(item.inventory.inventory.toString());
            if (!data) continue;
            let status;
            if (data.slotsUsed < data.available) { status = "inStock"; data.slotsUsed++; }
            else if (data.orderedItemIds.has(item._id.toString())) { status = "ordered"; }
            else if (data.poSlotsRemaining > 0) { status = "ordered"; data.poSlotsRemaining--; }
            else { status = "attached"; data.attachedAdded++; }
            itemOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: status } } } });
        }

        const invOps = [...invMap.entries()]
            .filter(([, d]) => d.slotsUsed > 0 || d.attachedAdded > 0)
            .map(([id, d]) => {
                const inc = {};
                if (d.slotsUsed) inc.allocated = d.slotsUsed;
                if (d.attachedAdded) inc.attachedCount = d.attachedAdded;
                return { updateOne: { filter: { _id: id }, update: { $inc: inc } } };
            });

        await Promise.all([
            itemOps.length ? Items.bulkWrite(itemOps, { ordered: false }) : Promise.resolve(),
            invOps.length ? Inventory.bulkWrite(invOps, { ordered: false }) : Promise.resolve(),
        ]);
    }

    // --- Group 2: no inventory assigned yet ---
    if (needsInventory.length) {
        console.log(`${needsInventory.length} items to assign inventory`);

        const uniqueKeys = [...new Set(needsInventory.map(i => `${i.colorName}-${i.sizeName}-${i.styleCode}`))];
        const invResults = await Inventory.find(
            { inventory_id: { $in: uniqueKeys.map(k => encodeURIComponent(k)) } },
            "_id inventory_id quantity allocated orders"
        ).lean();
        const invByKey = new Map(invResults.map(inv => [inv.inventory_id, inv]));

        const missedSamples = [...new Map(
            needsInventory
                .filter(i => !invByKey.has(encodeURIComponent(`${i.colorName}-${i.sizeName}-${i.styleCode}`)))
                .map(i => [`${i.colorName}|${i.sizeName}|${i.styleCode}`, i])
        ).values()];
        if (missedSamples.length) {
            await Promise.all(missedSamples.map(async item => {
                const inv = await Inventory.findOne({
                    $or: [
                        { inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` },
                        { color_name: item.colorName, size_name: item.sizeName, style_code: item.styleCode },
                    ]
                }, "_id inventory_id quantity allocated orders").lean();
                if (inv) invByKey.set(encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`), inv);
            }));
        }

        const byInv = {};
        for (const item of needsInventory) {
            const key = encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`);
            const inv = invByKey.get(key);
            if (!inv) continue;
            const k = inv._id.toString();
            if (!byInv[k]) byInv[k] = { inv, items: [] };
            byInv[k].items.push(item);
        }

        const itemOps = [], invOps = [];
        for (const { inv, items: invItems } of Object.values(byInv)) {
            const available = Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0));
            // New items being assigned won't be in any existing PO's items[], so use unfilled slot count
            let poSlotsRemaining = (inv.orders || []).reduce(
                (sum, o) => sum + Math.max(0, (o.quantity ?? 0) - (o.items || []).length), 0
            );
            let slotsUsed = 0, attachedAdded = 0;
            for (const item of invItems) {
                let status;
                if (slotsUsed < available) { status = "inStock"; slotsUsed++; }
                else if (poSlotsRemaining > 0) { status = "ordered"; poSlotsRemaining--; }
                else { status = "attached"; attachedAdded++; }
                itemOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: {
                    "inventory.inventoryType": "inventory",
                    "inventory.inventory": inv._id,
                    "inventory.productInventory": null,
                    stockStatus: status,
                } } } });
            }
            const inc = {};
            if (slotsUsed) inc.allocated = slotsUsed;
            if (attachedAdded) inc.attachedCount = attachedAdded;
            if (Object.keys(inc).length) invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $inc: inc } } });
        }

        await Promise.all([
            itemOps.length ? Items.bulkWrite(itemOps, { ordered: false }) : Promise.resolve(),
            invOps.length ? Inventory.bulkWrite(invOps, { ordered: false }) : Promise.resolve(),
        ]);
    }

    await promoteAttached();
}

setInterval(() => {
    if (process.env.pm_id == 9 || process.env.pm_id == "9") {
        addItemsToInventory();
        reconcileAllocated();
    }
}, 1000 * 60 * 15);
