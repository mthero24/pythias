import Items from "../models/Items";
import Order from "../models/Order";
import Batches from "../models/batches";
import {Sort} from "@pythias/labels";
import { generatePieceID } from "@pythias/integrations";
import "@/functions/addItemsToInventory";
import Size from "@/models/Size";
export async function LabelsData(){
    // let inv = Inventory.deleteMany({inventory_id: {$regex: "\/"}})
    // console.log("inv count", (await inv).length, "+++++++++++++++++++")
    let orders = await Order.find({
        $expr: {
            $gt: [{
                $size: "$items"
            }, 50]
        },
        status: {$nin: ["canceled", "returned", "shipped", "Shipped", "delivered"]},
        date: {$gte: new Date("2025-10-31")},
        bulk: { $in: [null, false] }
    }).populate("items");
    console.log(orders.length, "orders with more than 50 items")
    for(let o of orders){
        o.bulk = true
        await o.save()
        let bulkId = generatePieceID()
        let skus = [] 
        for(let i of o.items){
           if(!skus.includes(i.sku)) skus.push(i.sku)
        }
        for(let s of skus){
            let bulkId = generatePieceID()
            let items = o.items.filter(it=> it.sku == s)
            for(let it of items){
                it.bulkId = bulkId
                await it.save()
            }
        }
    }
    let labels = {
            Standard: await Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            paid: true,
            bulkId: { $eq: null },
            shippingType: "Standard",
            order: { $ne: null },
            type: { $nin: ["sublimation", "gift"] },
            }).populate("order", "poNumber items marketplace").populate("inventory.inventory").lean(),
            Expedited: await Items.find({
            styleV2: { $ne: undefined },
            bulkId: { $eq: null },
            labelPrinted: false,
            canceled: false,
            order: { $ne: null },
            paid: true,
            type: { $nin: ["sublimation", "gift"] },
            shippingType: { $ne: "Standard" },
            }).populate("order", "poNumber items marketplace").populate("inventory.inventory").lean()
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
    giftOrders = await Order.find({_id: {$in: giftOrders}}).select("poNumber items marketplace").lean()
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