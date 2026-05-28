import {Items, Order, Batches} from "@pythias/mongo";
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