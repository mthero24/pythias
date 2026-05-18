import Items from "../models/Items";
import Order from "../models/Order";
import Batches from "../models/batches";
import { Inventory } from "@pythias/mongo";
import {Sort} from "@pythias/labels";
import { generatePieceID } from "@pythias/integrations";
import "@/functions/addItemsToInventory";
export async function LabelsData(){
    // let inv = Inventory.deleteMany({inventory_id: {$regex: "\/"}})
    // console.log("inv count", (await inv).length, "+++++++++++++++++++")
    const bulkOrders = await Order.find({
        $expr: { $gt: [{ $size: "$items" }, 50] },
        status: { $nin: ["canceled", "returned", "shipped", "Shipped", "delivered", "Pending Payment", "Pending Artwork Approval"] },
        date: { $gte: new Date("2025-10-31") },
        bulk: { $in: [null, false] }
    }).populate("items");
    console.log(bulkOrders.length, "orders with more than 50 items")
    if (bulkOrders.length > 0) {
        const orderBulkOps = [];
        const itemBulkOps = [];
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
            Items.bulkWrite(itemBulkOps, { ordered: false }),
        ]);
    }
    const [standardItems, expeditedItems] = await Promise.all([
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
    ]);
    let labels = { Standard: standardItems, Expedited: expeditedItems };
    let Marketplace = []
    for(let k of Object.keys(labels)){
        Marketplace = [...Marketplace, ...labels[k].filter(l=> l.order?.marketplace != null && l.order?.marketplace != undefined)]
        labels[k] = labels[k].filter(l=> l.order?.marketplace == null || l.order?.marketplace == undefined)
    }
    console.log(Marketplace.length, "marketplace labels")
    labels["Marketplace"] = Marketplace
    let rePulls = 0
    for (const k of Object.keys(labels)) {
        labels[k] = labels[k].filter(l => l.order != undefined)
        rePulls += labels[k].filter(l => l.rePulled).length
        labels[k] = await Sort(labels[k])
    }

    // Step 1: Link unassigned items to inventory (no status assignment, no counter changes)
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

    // Step 2: Full recompute of stockStatus for ALL items with inventory (FIFO by date)
    const allWithInv = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.inventory?.inventory != null) allWithInv.push(l);
        }
    }

    if (allWithInv.length > 0) {
        const allInvIds = [...new Set(allWithInv.map(l => (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString()).filter(Boolean))];
        const allInvDocs = await Inventory.find({ _id: { $in: allInvIds } }, "quantity orders").lean();
        const allInvMap = new Map(allInvDocs.map(inv => [inv._id.toString(), {
            quantity: inv.quantity ?? 0,
            hasActiveOrder: (inv.orders || []).length > 0,
            slotsUsed: 0,
        }]));

        allWithInv.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

        const updateOps = [];
        for (const l of allWithInv) {
            const invId = (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString();
            const data = allInvMap.get(invId);
            if (!data) continue;
            let computed;
            if (data.slotsUsed < data.quantity) { computed = "inStock"; data.slotsUsed++; }
            else if (data.hasActiveOrder) { computed = "ordered"; }
            else { computed = "attached"; }
            if (l.stockStatus !== computed) {
                updateOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: { stockStatus: computed } } } });
            }
            l.stockStatus = computed;
        }
        if (updateOps.length) Items.bulkWrite(updateOps, { ordered: false }); // fire-and-forget
    }
    //console.log(labels.Standard[0], "standard labels")
    let giftMessages = await Items.find({
        labelPrinted: false, paid: true, canceled: false, type: "gift", sku: {
            $in: ["gift-bag", "gift-message"]}
        }).lean()
    let giftOrderIds = giftMessages.map(s=> s.order)
    const giftOrderList = await Order.find({_id: {$in: giftOrderIds}}).select("poNumber items marketplace").lean()
    const giftOrderMap = Object.fromEntries(giftOrderList.map(o => [o._id.toString(), o]))
    giftMessages = giftMessages.map(s=> {
        s.order = giftOrderMap[s.order.toString()];
        s.styleCode = "GIFT";
        return {...s}
    })
    //console.log(giftMessages)
    //giftMessages.map(g=>console.log(g.order))
    giftMessages = giftMessages.filter(s=> typeof s.order !== "undefined")
    //console.log(giftMessages)
    if(labels) labels = JSON.parse(JSON.stringify(labels))
    if(giftMessages) giftMessages = JSON.parse(JSON.stringify(giftMessages))
    let batches = JSON.parse(
        JSON.stringify(await Batches.find({}).limit(20).sort({ _id: -1 }).lean())
    );
    //console.log(batches)
    return {labels, giftMessages, rePulls, batches}
}