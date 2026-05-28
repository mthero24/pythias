import Items from "../models/Items";
import Order from "../models/Order";
import Batches from "../models/batches";
import { Inventory } from "@pythias/mongo";
import {Sort} from "@pythias/labels";
import { generatePieceID } from "@pythias/integrations";
import "@/functions/addItemsToInventory";

export async function LabelsData(){
    // Phase 1: fire all independent queries at once
    const [bulkOrders, standardItems, expeditedItems, giftItemsRaw, batches] = await Promise.all([
        Order.find({
            $expr: { $gt: [{ $size: "$items" }, 50] },
            status: { $nin: ["canceled", "returned", "shipped", "Shipped", "delivered", "Pending Payment", "Pending Artwork Approval"] },
            date: { $gte: new Date("2025-10-31") },
            bulk: { $in: [null, false] }
        }).populate("items"),
        Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            paid: true,
            bulkId: { $eq: null },
            shippingType: "Standard",
            order: { $ne: null },
            type: { $nin: ["sublimation", "gift"] },
        }).populate("order", "poNumber items marketplace").populate("inventory.inventory", "row unit shelf bin quantity").lean(),
        Items.find({
            styleV2: { $ne: undefined },
            bulkId: { $eq: null },
            labelPrinted: false,
            canceled: false,
            order: { $ne: null },
            paid: true,
            type: { $nin: ["sublimation", "gift"] },
            shippingType: { $ne: "Standard" },
        }).populate("order", "poNumber items marketplace").populate("inventory.inventory", "row unit shelf bin quantity").lean(),
        Items.find({
            labelPrinted: false, paid: true, canceled: false, type: "gift",
            sku: { $in: ["gift-bag", "gift-message"] },
        }).lean(),
        Batches.find({}).limit(20).sort({ _id: -1 }).lean(),
    ]);

    // Phase 2: bulk-order tagging (fire-and-forget) + gift order lookup — in parallel
    const giftOrderIds = giftItemsRaw.map(s => s.order);
    const [, giftOrderList] = await Promise.all([
        (async () => {
            if (!bulkOrders.length) return;
            console.log(bulkOrders.length, "orders with more than 50 items");
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
            // fire-and-forget — don't block the response
            Promise.all([
                Order.bulkWrite(orderBulkOps, { ordered: false }),
                Items.bulkWrite(itemBulkOps, { ordered: false }),
            ]);
        })(),
        Order.find({ _id: { $in: giftOrderIds } }).select("poNumber items marketplace").lean(),
    ]);

    // Build labels map and split marketplace
    let labels = { Standard: standardItems, Expedited: expeditedItems };
    let Marketplace = [];
    for (const k of Object.keys(labels)) {
        Marketplace = [...Marketplace, ...labels[k].filter(l => l.order?.marketplace != null)];
        labels[k]  = labels[k].filter(l => l.order?.marketplace == null);
    }
    labels["Marketplace"] = Marketplace;

    // Phase 3: sort all categories in parallel
    let rePulls = 0;
    const sorted = await Promise.all(
        Object.keys(labels).map(async k => {
            labels[k] = labels[k].filter(l => l.order != undefined);
            rePulls += labels[k].filter(l => l.rePulled).length;
            return [k, await Sort(labels[k])];
        })
    );
    for (const [k, v] of sorted) labels[k] = v;

    // Phase 4: link unassigned items to inventory (blocks display — needed for new items)
    const needsAssignment = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.inventory?.inventory == null) needsAssignment.push(l);
        }
    }

    if (needsAssignment.length > 0) {
        const uniqueEncodedKeys = [...new Set(needsAssignment.map(l => encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`)))];
        const invResults = await Inventory.find({ inventory_id: { $in: uniqueEncodedKeys } }, "_id inventory_id quantity orders").lean();
        const invData = new Map(invResults.map(inv => [inv.inventory_id, inv]));

        const missedSamples = [...new Map(
            needsAssignment
                .filter(l => !invData.has(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`)))
                .map(l => [`${l.colorName}|${l.sizeName}|${l.styleCode}`, l])
        ).values()];
        if (missedSamples.length) {
            await Promise.all(missedSamples.map(async l => {
                const inv = await Inventory.findOne({
                    $or: [
                        { inventory_id: `${l.colorName}-${l.sizeName}-${l.styleCode}` },
                        { color_name: l.colorName, size_name: l.sizeName, style_code: l.styleCode },
                    ]
                }, "_id inventory_id quantity orders").lean();
                if (!inv) return;
                invData.set(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`), inv);
            }));
        }

        const linkOps = [];
        for (const l of needsAssignment) {
            const inv = invData.get(encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`));
            if (!inv) continue;
            l.inventory = { inventoryType: "inventory", inventory: inv, productInventory: null };
            linkOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: {
                "inventory.inventoryType": "inventory",
                "inventory.inventory": inv._id,
                "inventory.productInventory": null,
            } } } });
        }
        if (linkOps.length) Items.bulkWrite(linkOps, { ordered: false }); // fire-and-forget
    }

    // Build gift messages
    const giftOrderMap = Object.fromEntries(giftOrderList.map(o => [o._id.toString(), o]));
    let giftMessages = giftItemsRaw
        .map(s => ({ ...s, order: giftOrderMap[s.order?.toString()], styleCode: "GIFT" }))
        .filter(s => s.order !== undefined);

    return {
        labels: JSON.parse(JSON.stringify(labels)),
        giftMessages: JSON.parse(JSON.stringify(giftMessages)),
        rePulls,
        batches: JSON.parse(JSON.stringify(batches)),
    };
}
