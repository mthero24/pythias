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

    // Separate items: no inventory assigned vs. has inventory but stockStatus not yet set
    const needsAssignment = [];
    const hasInvNoStatus = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.inventory?.inventory == null) needsAssignment.push(l);
            else if (!l.stockStatus) hasInvNoStatus.push(l);
        }
    }

    // Items with inventory assigned but no stockStatus — claim slots via allocated counter
    if (hasInvNoStatus.length > 0) {
        const invIds = [...new Set(hasInvNoStatus.map(l => (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString()).filter(Boolean))];
        const invDocs = await Inventory.find({ _id: { $in: invIds } }, "quantity allocated orders").lean();
        const invMap = new Map(invDocs.map(inv => [inv._id.toString(), {
            available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)),
            orderedIds: new Set((inv.orders || []).flatMap(o => (o.items || []).map(i => i.toString()))),
            slotsUsed: 0, attachedAdded: 0,
        }]));

        const statusOps = [];
        for (const l of hasInvNoStatus) {
            const invId = (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString();
            const data = invMap.get(invId);
            if (!data) continue;
            let status;
            if (data.orderedIds.has(l._id.toString())) { status = "ordered"; }
            else if (data.slotsUsed < data.available) { status = "inStock"; data.slotsUsed++; }
            else { status = "attached"; data.attachedAdded++; }
            l.stockStatus = status;
            statusOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: { stockStatus: status } } } });
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
            statusOps.length ? Items.bulkWrite(statusOps, { ordered: false }) : Promise.resolve(),
            invOps.length ? Inventory.bulkWrite(invOps, { ordered: false }) : Promise.resolve(),
        ]);
    }

    // Batch-assign inventory to items with no inventory reference
    if (needsAssignment.length > 0) {
        const uniqueEncodedKeys = [...new Set(needsAssignment.map(l => encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`)))];
        const invResults = await Inventory.find({ inventory_id: { $in: uniqueEncodedKeys } }, "_id inventory_id quantity allocated orders").lean();
        const invData = new Map(invResults.map(inv => [inv.inventory_id, {
            _id: inv._id, inv,
            available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)),
            slotsUsed: 0, attachedAdded: 0,
        }]));

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
                }, "_id inventory_id quantity allocated orders").lean();
                if (!inv) return;
                const key = encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`);
                invData.set(key, { _id: inv._id, inv, available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)), slotsUsed: 0, attachedAdded: 0 });
            }));
        }

        const itemOps = [];
        for (const l of needsAssignment) {
            const key = encodeURIComponent(`${l.colorName}-${l.sizeName}-${l.styleCode}`);
            const data = invData.get(key);
            if (!data) continue;
            const status = data.slotsUsed < data.available ? "inStock" : "attached";
            if (status === "inStock") data.slotsUsed++; else data.attachedAdded++;
            l.inventory = { inventoryType: "inventory", inventory: data.inv, productInventory: null };
            l.stockStatus = status;
            itemOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: {
                "inventory.inventoryType": "inventory",
                "inventory.inventory": data._id,
                "inventory.productInventory": null,
                stockStatus: status,
            } } } });
        }

        const invOps = [...invData.values()]
            .filter(d => d.slotsUsed > 0 || d.attachedAdded > 0)
            .map(d => {
                const inc = {};
                if (d.slotsUsed) inc.allocated = d.slotsUsed;
                if (d.attachedAdded) inc.attachedCount = d.attachedAdded;
                return { updateOne: { filter: { _id: d._id }, update: { $inc: inc } } };
            });

        await Promise.all([
            itemOps.length ? Items.bulkWrite(itemOps, { ordered: false }) : Promise.resolve(),
            invOps.length ? Inventory.bulkWrite(invOps, { ordered: false }) : Promise.resolve(),
        ]);
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