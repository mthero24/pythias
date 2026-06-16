import { Inventory, InventoryOrders } from "@pythias/mongo";
import Items from "@/models/Items";
import Order from "@/models/Order";
import { generatePieceID } from "@pythias/integrations";

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
        const [invDocs, activeOrders1] = await Promise.all([
            Inventory.find({ _id: { $in: invIds } }, "quantity allocated").lean(),
            InventoryOrders.find(
                { received: { $ne: true }, "locations.items.inventory": { $in: invIds } },
                "locations"
            ).lean(),
        ]);

        const orderedCapMap1 = new Map();
        for (const po of activeOrders1) {
            for (const loc of po.locations || []) {
                if (loc.received) continue;
                for (const item of loc.items || []) {
                    const k = item.inventory?.toString();
                    if (!k) continue;
                    orderedCapMap1.set(k, (orderedCapMap1.get(k) ?? 0) + (item.quantity ?? 0));
                }
            }
        }

        const invMap = new Map(invDocs.map(inv => [inv._id.toString(), {
            available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)),
            orderedCapacity: orderedCapMap1.get(inv._id.toString()) ?? 0,
            slotsUsed: 0, orderedUsed: 0, attachedAdded: 0,
        }]));

        const itemOps = [];
        for (const item of hasInventory) {
            const data = invMap.get(item.inventory.inventory.toString());
            if (!data) continue;
            let status;
            if (data.slotsUsed < data.available) { status = "inStock"; data.slotsUsed++; }
            else if (data.orderedUsed < data.orderedCapacity) { status = "ordered"; data.orderedUsed++; }
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

        const g2InvIds = Object.keys(byInv);
        const activeOrders2 = g2InvIds.length ? await InventoryOrders.find(
            { received: { $ne: true }, "locations.items.inventory": { $in: g2InvIds } },
            "locations"
        ).lean() : [];
        const orderedCapMap2 = new Map();
        for (const po of activeOrders2) {
            for (const loc of po.locations || []) {
                if (loc.received) continue;
                for (const item of loc.items || []) {
                    const k = item.inventory?.toString();
                    if (!k) continue;
                    orderedCapMap2.set(k, (orderedCapMap2.get(k) ?? 0) + (item.quantity ?? 0));
                }
            }
        }

        const itemOps = [], invOps = [];
        for (const { inv, items: invItems } of Object.values(byInv)) {
            const available = Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0));
            const orderedCapacity = orderedCapMap2.get(inv._id.toString()) ?? 0;
            let slotsUsed = 0, orderedUsed = 0, attachedAdded = 0;
            for (const item of invItems) {
                let status;
                if (slotsUsed < available) { status = "inStock"; slotsUsed++; }
                else if (orderedUsed < orderedCapacity) { status = "ordered"; orderedUsed++; }
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

// Re-validates stockStatus for all active items with inventory assigned.
// Runs on a schedule so page loads just read current DB values.
export const recomputeStockStatus = async () => {
    const allWithInv = await Items.find({
        labelPrinted: false,
        canceled: false,
        shipped: false,
        paid: true,
        "inventory.inventory": { $exists: true, $ne: null },
    }).select("_id inventory.inventory stockStatus date").sort({ date: 1 }).lean();

    if (!allWithInv.length) return;

    const allInvIds = [...new Set(allWithInv.map(i => i.inventory.inventory.toString()))];
    const [allInvDocs, activeOrders] = await Promise.all([
        Inventory.find({ _id: { $in: allInvIds } }, "quantity allocated").lean(),
        InventoryOrders.find(
            { received: { $ne: true }, "locations.items.inventory": { $in: allInvIds } },
            "locations"
        ).lean(),
    ]);

    const orderedCapMap = new Map();
    for (const po of activeOrders) {
        for (const loc of po.locations || []) {
            if (loc.received) continue;
            for (const item of loc.items || []) {
                const k = item.inventory?.toString();
                if (!k) continue;
                orderedCapMap.set(k, (orderedCapMap.get(k) ?? 0) + (item.quantity ?? 0));
            }
        }
    }

    const invMap = new Map(allInvDocs.map(inv => [inv._id.toString(), {
        quantity: Math.max(0, inv.quantity ?? 0),
        orderedCapacity: orderedCapMap.get(inv._id.toString()) ?? 0,
        slotsUsed: 0,
        orderedUsed: 0,
    }]));

    const updateOps = [];
    for (const item of allWithInv) {
        const invId = item.inventory.inventory.toString();
        const data = invMap.get(invId);
        if (!data) continue;
        let computed;
        if (data.slotsUsed < data.quantity) { computed = "inStock"; data.slotsUsed++; }
        else if (data.orderedUsed < data.orderedCapacity) { computed = "ordered"; data.orderedUsed++; }
        else { computed = "attached"; }
        if (item.stockStatus !== computed) {
            updateOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: computed } } } });
        }
    }
    if (updateOps.length) await Items.bulkWrite(updateOps, { ordered: false });
};

// Reconcile the per-item `stockStatus: "ordered"` flag back to the authoritative PO truth.
// The "ordered" flag drifts ABOVE the real unreceived-PO quantity because:
//   1. items keep "ordered" after they're canceled / shipped / label-printed (recompute
//      skips those, so it never resets them), and
//   2. items can be flagged "ordered" with no inventory / beyond active PO capacity.
// This pass clears the stale flags, then re-runs the capped recompute so active items are
// re-bucketed against real capacity. After this, count(stockStatus="ordered") == sum of
// unreceived PO line quantities.
//
// dryRun=true reports what WOULD change without writing — use it to preview 472 → 311.
export const reconcileOrderedStatus = async ({ dryRun = false } = {}) => {
    // Stale "ordered" flags on items that are out of the active pipeline. These should
    // never count as "on order" — recompute's active-item query skips them, so clear here.
    const staleFilter = {
        stockStatus: "ordered",
        $or: [
            { canceled: true },
            { shipped: true },
            { labelPrinted: true },
            { "inventory.inventory": { $in: [null, undefined] } },
            { "inventory.inventory": { $exists: false } },
        ],
    };

    const staleCount = await Items.countDocuments(staleFilter);
    const totalOrderedBefore = await Items.countDocuments({ stockStatus: "ordered" });

    // Authoritative active-PO capacity (the "311") — sum of unreceived location quantities.
    const activeOrders = await InventoryOrders.find(
        { received: { $ne: true } }, "locations"
    ).lean();
    let activeCapacity = 0;
    for (const po of activeOrders) {
        for (const loc of po.locations || []) {
            if (loc.received) continue;
            for (const item of loc.items || []) activeCapacity += item.quantity ?? 0;
        }
    }

    const report = {
        dryRun,
        totalOrderedBefore,
        staleOrderedToClear: staleCount,
        activePOCapacity: activeCapacity,
    };

    if (dryRun) {
        report.note = "No changes written. Run with dryRun=false to apply, then recompute caps active items at capacity.";
        return report;
    }

    // Clear stale flags (set to null — these items are not in the active inventory pipeline).
    if (staleCount > 0) {
        await Items.updateMany(staleFilter, { $set: { stockStatus: null } });
    }

    // Re-bucket active items against real capacity (caps "ordered" at orderedCapacity).
    await recomputeStockStatus();

    report.totalOrderedAfter = await Items.countDocuments({ stockStatus: "ordered" });
    return report;
};

export async function tagBulkOrders() {
    const bulkOrders = await Order.find({
        $expr: { $gt: [{ $size: "$items" }, 50] },
        status: { $nin: ["canceled", "returned", "shipped", "Shipped", "delivered", "Pending Payment", "Pending Artwork Approval"] },
        date: { $gte: new Date("2025-10-31") },
        bulk: { $in: [null, false] },
    }).populate("items").lean();

    if (!bulkOrders.length) return;
    console.log(bulkOrders.length, "orders with more than 50 items — tagging");

    const orderBulkOps = [];
    const itemBulkOps  = [];
    for (const o of bulkOrders) {
        orderBulkOps.push({ updateOne: { filter: { _id: o._id }, update: { $set: { bulk: true } } } });
        const skus = [...new Set(o.items.filter(i => !i.canceled).map(i => i.sku))];
        for (const s of skus) {
            const bulkId = generatePieceID();
            o.items.filter(it => it.sku === s && !it.canceled).forEach(it => {
                itemBulkOps.push({ updateOne: { filter: { _id: it._id }, update: { $set: { bulkId } } } });
            });
        }
    }
    await Promise.all([
        Order.bulkWrite(orderBulkOps, { ordered: false }),
        Items.bulkWrite(itemBulkOps,  { ordered: false }),
    ]);
}

// NOTE: The background maintenance chain (tagBulkOrders → addItemsToInventory →
// reconcileOrderedStatus → reconcileAllocated) previously ran here in an in-process
// setInterval gated on `pm_id == 9` — fragile: it only ran if that one web worker was up.
// It now runs as a dedicated PM2 service ("inventory-maintenance-po", every 15 min) that
// hits /api/internal/inventory/maintenance, so it runs no matter which worker is alive.
