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
            shippingType: "Standard",
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
            shippingType: { $ne: "Standard" },
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
    let labels = { Standard: [...standardItems, ...blankItems], Expedited: expeditedItems };
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

    // Assign stockStatus to PP items that have inventory but no status yet
    const hasInvNoStatus = [];
    for (const k of Object.keys(labels)) {
        for (const l of labels[k]) {
            if (l.inventory?.inventory != null && !l.stockStatus) hasInvNoStatus.push(l);
        }
    }

    if (hasInvNoStatus.length > 0) {
        const invIds = [...new Set(hasInvNoStatus.map(l => (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString()).filter(Boolean))];
        const invDocs = await Inventory.find({ _id: { $in: invIds } }, "quantity allocated orders").lean();
        const invMap = new Map(invDocs.map(inv => [inv._id.toString(), {
            available: Math.max(0, (inv.quantity ?? 0) - (inv.allocated ?? 0)),
            hasActiveOrder: (inv.orders || []).length > 0,
            slotsUsed: 0, attachedAdded: 0,
        }]));

        const statusOps = [];
        for (const l of hasInvNoStatus) {
            const invId = (l.inventory.inventory?._id ?? l.inventory.inventory)?.toString();
            const data = invMap.get(invId);
            if (!data) continue;
            let status;
            if (data.slotsUsed < data.available) { status = "inStock"; data.slotsUsed++; }
            else if (data.hasActiveOrder) { status = "ordered"; }
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