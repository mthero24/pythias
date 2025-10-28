import {Items, Order, Inventory, Batches} from "@pythias/mongo";
import {Sort} from "@pythias/labels";
export async function LabelsData(){
    // let inv = Inventory.deleteMany({inventory_id: {$regex: "\/"}})
    // console.log("inv count", (await inv).length, "+++++++++++++++++++")
    let labels = {
            Standard: await Items.find({
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
            Expedited: await Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: { $ne: "Standard" },
            }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").lean()
    }
    //console.log(labels)
    let rePulls = 0
    let blankItems = await Items.find({
        blank: { $ne: undefined },
        colorName: { $ne: null },
        sizeName: { $ne: null },
        isBlank: true,
        labelPrinted: false,
        canceled: false,
        paid: true,
    }).populate("color", "name _id").populate("designRef", "sku name printType").populate("inventory.inventory inventory.productInventory").lean()
    labels.Standard = labels.Standard.concat(blankItems)
    for(let k of Object.keys(labels)){
        let standardOrders = labels[k].map(s=> s.order)
        standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items marketplace date")
        labels[k] = labels[k].map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order._id.toString())[0];  return {...s}})
        labels[k] = labels[k].map(s=> {
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
    let giftOrders = giftMessages.map(s=> s.order)
    giftOrders = await Order.find({_id: {$in: giftOrders}}).select("poNumber items")
    //console.log(giftOrders)
    giftMessages = giftMessages.map(s=> { 
        s.order = giftOrders.filter(o=> o._id.toString() == s.order.toString())[0]; 
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