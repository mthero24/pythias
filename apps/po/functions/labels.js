import Items from "../models/Items";
import Order from "../models/Order";
import Batches from "../models/batches";
import { Inventory } from "@pythias/mongo";
import { Sort } from "@pythias/labels";
import "@/functions/addItemsToInventory";

export async function LabelsData() {

    // Phase 1: all Items queries in parallel — no populate, raw ObjectId refs only
    const [standardItems, expeditedItems, giftItemsRaw, batches, bumpItems] = await Promise.all([
        Items.find({
            styleV2:      { $ne: null },
            labelPrinted: false,
            canceled:     false,
            paid:         true,
            bulkId:       { $eq: null },
            shippingType: "Standard",
            order:        { $ne: null },
            type:         { $nin: ["sublimation", "gift"] },
        }).lean(),
        Items.find({
            styleV2:      { $ne: null },
            bulkId:       { $eq: null },
            labelPrinted: false,
            canceled:     false,
            order:        { $ne: null },
            paid:         true,
            type:         { $nin: ["sublimation", "gift"] },
            shippingType: { $ne: "Standard" },
        }).lean(),
        Items.find({
            type: "gift", labelPrinted: false, paid: true, canceled: false,
            sku: { $in: ["gift-message", "gift-bag"] },
        }).lean(),
        Batches.find({}).limit(20).sort({ _id: -1 }).lean(),
        Items.find({
            styleCode:    "BUMP",
            labelPrinted: false,
            canceled:     false,
            paid:         true,
            order:        { $ne: null },
        }).lean(),
    ]);

    // Phase 2: batch-fetch orders + inventory + gift orders — all three in parallel
    const labelItems = [...standardItems, ...expeditedItems, ...bumpItems];
    const uniqueOrderIds = [...new Set(labelItems.map(i => i.order?.toString()).filter(Boolean))];
    const uniqueInvIds   = [...new Set(labelItems.map(i => i.inventory?.inventory?.toString()).filter(Boolean))];
    const giftOrderIds   = giftItemsRaw.map(s => s.order?.toString()).filter(Boolean);

    const [orderList, invList, giftOrderList] = await Promise.all([
        Order.find({ _id: { $in: uniqueOrderIds } }, "poNumber marketplace").lean(),
        Inventory.find({ _id: { $in: uniqueInvIds } }, "row unit shelf bin quantity").lean(),
        Order.find({ _id: { $in: giftOrderIds } }, "poNumber marketplace").lean(),
    ]);

    const orderMap = new Map(orderList.map(o => [o._id.toString(), o]));
    const invMap   = new Map(invList.map(i => [i._id.toString(), i]));

    // Attach order and inventory to all label items
    for (const item of labelItems) {
        if (item.order) item.order = orderMap.get(item.order.toString()) ?? null;
        const invId = item.inventory?.inventory?.toString();
        if (invId) item.inventory = { ...item.inventory, inventory: invMap.get(invId) ?? null };
    }

    // BUMP items have no inventory — mark ready and merge by shipping type
    const bumpReady = bumpItems.map(i => ({ ...i, stockStatus: "inStock" }));

    // Build labels map and split marketplace
    let labels = {
        Standard:  [...standardItems,  ...bumpReady.filter(i => i.shippingType === "Standard")],
        Expedited: [...expeditedItems, ...bumpReady.filter(i => i.shippingType !== "Standard")],
    };
    let Marketplace = [];
    for (const k of Object.keys(labels)) {
        Marketplace = [...Marketplace, ...labels[k].filter(l => l.order?.marketplace != null)];
        labels[k]   = labels[k].filter(l => l.order?.marketplace == null);
    }
    labels["Marketplace"] = Marketplace;

    // Phase 3: sort all categories in parallel
    let rePulls = 0;
    const sorted = await Promise.all(
        Object.keys(labels).map(async k => {
            labels[k] = labels[k].filter(l => l.order != null);
            rePulls += labels[k].filter(l => l.rePulled).length;
            return [k, await Sort(labels[k])];
        })
    );
    for (const [k, v] of sorted) labels[k] = v;

    // Phase 4: link unassigned items to inventory (BUMP skipped — no inventory)
    const needsAssignment = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.inventory?.inventory == null && l.styleCode !== "BUMP") needsAssignment.push(l);
        }
    }

    if (needsAssignment.length > 0) {
        const uniqueEncodedKeys = [...new Set(
            needsAssignment.map(l => encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`))
        )];
        const invResults = await Inventory.find(
            { inventory_id: { $in: uniqueEncodedKeys } },
            "_id inventory_id quantity"
        ).lean();
        const invData = new Map(invResults.map(inv => [inv.inventory_id, inv]));

        const missedSamples = [...new Map(
            needsAssignment
                .filter(l => !invData.has(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`)))
                .map(l => [`${l.colorName}|${l.sizeName}|${l.styleCode}`, l])
        ).values()];

        if (missedSamples.length) {
            const unencodedKeys = missedSamples.map(l => `${l.colorName}-${l.sizeName}-${l.styleCode}`);
            const unencodedResults = await Inventory.find(
                { inventory_id: { $in: unencodedKeys } },
                "_id inventory_id quantity"
            ).lean();
            for (const inv of unencodedResults) {
                invData.set(encodeURIComponent(inv.inventory_id), inv);
            }

            const stillMissed = missedSamples.filter(
                l => !invData.has(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`))
            );
            if (stillMissed.length) {
                const fieldResults = await Inventory.find({
                    $or: stillMissed.map(l => ({
                        color_name: l.colorName, size_name: l.sizeName, style_code: l.styleCode,
                    })),
                }, "_id inventory_id color_name size_name style_code quantity").lean();
                for (const inv of fieldResults) {
                    const key = encodeURIComponent(`${inv.color_name}-${inv.size_name}-${inv.style_code}`);
                    invData.set(key, inv);
                }
            }
        }

        const linkOps = [];
        for (const l of needsAssignment) {
            const inv = invData.get(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`));
            if (!inv) continue;
            l.inventory = { inventoryType: "inventory", inventory: inv, productInventory: null };
            linkOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: {
                "inventory.inventoryType":    "inventory",
                "inventory.inventory":        inv._id,
                "inventory.productInventory": null,
            } } } });
        }
        if (linkOps.length) Items.bulkWrite(linkOps, { ordered: false });
    }

    // Build gift messages
    const giftOrderMap = new Map(giftOrderList.map(o => [o._id.toString(), o]));
    const giftMessages = giftItemsRaw
        .map(s => ({ ...s, order: giftOrderMap.get(s.order?.toString()), styleCode: "GIFT" }))
        .filter(s => s.order != null);

    return {
        labels:       JSON.parse(JSON.stringify(labels)),
        giftMessages: JSON.parse(JSON.stringify(giftMessages)),
        rePulls,
        batches:      JSON.parse(JSON.stringify(batches)),
    };
}
