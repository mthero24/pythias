import Items from "../models/Items";
import Order from "../models/Order";
import {Inventory} from "@pythias/mongo";
import Batches from "../models/batches";
import {Sort} from "@pythias/labels";
import { style } from "@mui/system";
import "@/functions/addItemsToInventory";
export async function LabelsData(){
    // let inv = Inventory.deleteMany({inventory_id: {$regex: "\/"}})
    // console.log("inv count", (await inv).length, "+++++++++++++++++++")
    let labels = {
            Standard: await Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: "Standard",
            order: { $ne: null },
            type: { $nin: ["sublimation", "gift"] },
            }).populate("order", "poNumber items").populate("inventory.inventory").lean(),
            Expedited: await Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            order: { $ne: null },
            paid: true,
            type: { $nin: ["sublimation", "gift"] },
            shippingType: { $ne: "Standard" },
        }).populate("order", "poNumber items").populate("inventory.inventory").lean()
    }
    let rePulls = 0
    for(let k of Object.keys(labels)){
        labels[k] = labels[k].filter(l=> l.order != undefined)
        rePulls += labels[k].filter(l=> l.rePulled).length
        labels[k] = await Sort(labels[k])
    }
    //console.log(labels.Standard[0], "standard labels")
    let giftMessages = await Items.find({
        labelPrinted: false, paid: true, canceled: false, type: "gift", sku: {
            $in: ["gift-bag", "gift-message"]}
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