import {Items, Order, Inventory, Batches} from "@pythias/mongo";
import {Sort} from "@pythias/labels";
export async function LabelsData(){
    // let inv = Inventory.deleteMany({inventory_id: {$regex: "\/"}})
    // console.log("inv count", (await inv).length, "+++++++++++++++++++")
    const [standardItems, expeditedItems, blankItems] = await Promise.all([
        Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: { $ne: "Expedited" },
        }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").lean(),
        Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: "Expedited",
        }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").lean(),
        Items.find({
            blank: { $ne: undefined },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            isBlank: true,
            labelPrinted: false,
            canceled: false,
            paid: true,
        }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").lean(),
    ]);
    let labels = { Standard: [...standardItems, ...blankItems], WholeSale: expeditedItems };
    let rePulls = 0
    for(let k of Object.keys(labels)){
        const orderIds = labels[k].map(s=> s.order)
        const orderList = await Order.find({_id: {$in: orderIds}}).select("poNumber items marketplace date").lean()
        const orderId = (s) => s.order?._id?.toString() ?? s.order?.toString()
        labels[k] = labels[k].map(s=> {
            s.order = orderList.filter(o=> o._id.toString() === orderId(s))[0];
            if(s.type == undefined) s.type = s.designRef && s.designRef.printType ? s.designRef.printType : "DTF"
            return {...s}
        })
        labels[k] = labels[k].filter(s=> s.order != undefined)
        rePulls += labels[k].filter(l=> l.rePulled).length
        labels[k] = await Sort(labels[k])
    }

    // Assign/validate stockStatus for items with inventory or a stale "ordered" tag.
    // Always re-validate "ordered" items so incorrectly-set tags get cleared immediately.
    const needsStatusCheck = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.stockStatus === "ordered" || (l.inventory?.inventory != null && !l.stockStatus)) {
                needsStatusCheck.push(l);
            }
        }
    }

    if (needsStatusCheck.length > 0) {
        const invIds = [...new Set(
            needsStatusCheck
                .map(l => (l.inventory?.inventory?._id ?? l.inventory?.inventory)?.toString())
                .filter(Boolean)
        )];
        // Use inStock array length — self-maintaining; allocated was never decremented so drifted wrong
        const invDocs = invIds.length
            ? await Inventory.find({ _id: { $in: invIds } }, "quantity inStock orders blank color sizeId").lean()
            : [];
        const invMap = new Map(invDocs.map(inv => {
            // Items explicitly listed in a PO are definitively "on order"
            const orderedItemIds = new Set((inv.orders || []).flatMap(o => (o.items || []).map(String)));
            // POs may have unfilled slots (quantity > items.length) — new items can claim them
            const poSlotsRemaining = (inv.orders || []).reduce(
                (sum, o) => sum + Math.max(0, (o.quantity ?? 0) - (o.items || []).length), 0
            );
            return [inv._id.toString(), {
                available: Math.max(0, (inv.quantity ?? 0) - (inv.inStock?.length ?? 0)),
                orderedItemIds,
                poSlotsRemaining,
                blank: inv.blank?.toString(),
                color: inv.color?.toString(),
                sizeId: inv.sizeId,
                slotsUsed: 0,
            }];
        }));

        const statusOps = [];
        const invPushOps = [];
        for (const l of needsStatusCheck) {
            const invId = (l.inventory?.inventory?._id ?? l.inventory?.inventory)?.toString();
            const data = invId ? invMap.get(invId) : null;

            let status;
            if (!data) {
                // No valid inventory — clear any stale "ordered" tag
                status = null;
            } else {
                // Validate blank/color/size match to prevent cross-SKU false positives
                const itemBlank = (l.blank?._id ?? l.blank)?.toString();
                const itemColor = (l.color?._id ?? l.color)?.toString();
                const itemSize  = (l.size?._id  ?? l.size)?.toString();
                const inventoryMatches =
                    (!data.blank  || !itemBlank || data.blank  === itemBlank) &&
                    (!data.color  || !itemColor || data.color  === itemColor) &&
                    (!data.sizeId || !itemSize  || data.sizeId === itemSize);

                if (!inventoryMatches) {
                    // Linked inventory is wrong SKU — clear so it shows as "No Inventory"
                    status = null;
                } else if (data.slotsUsed < data.available) {
                    status = "inStock"; data.slotsUsed++;
                } else if (data.orderedItemIds.has(l._id.toString())) {
                    // Item is explicitly reserved in a PO
                    status = "ordered";
                } else if (data.poSlotsRemaining > 0) {
                    // PO has unfilled slots — this item qualifies for one
                    status = "ordered"; data.poSlotsRemaining--;
                } else {
                    status = "attached";
                }
            }

            if (l.stockStatus === status) continue; // nothing changed
            l.stockStatus = status;
            statusOps.push({ updateOne: { filter: { _id: l._id }, update: { $set: { stockStatus: status } } } });
            if (status === "inStock") {
                invPushOps.push({ updateOne: { filter: { _id: invId }, update: { $addToSet: { inStock: l._id } } } });
            }
        }

        await Promise.all([
            statusOps.length ? Items.bulkWrite(statusOps, { ordered: false }) : Promise.resolve(),
            invPushOps.length ? Inventory.bulkWrite(invPushOps, { ordered: false }) : Promise.resolve(),
        ]);
    }
    let giftMessages = await Items.find({
        labelPrinted: false,
        canceled: false,
        paid: true,
        type: "gift",
        sku: { $in: ["gift-bag"] },
        }).lean()
    const giftOrderIds = giftMessages.map(s=> s.order)
    const giftOrderList = await Order.find({_id: {$in: giftOrderIds}}).select("poNumber items").lean()
    giftMessages = giftMessages.map(s=> {
        s.order = giftOrderList.filter(o=> o._id.toString() === s.order?.toString())[0];
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