import {Main} from "@pythias/sublimation";
import Items from "../../../models/Items";
import Order from "../../../models/Order";
import Inventory from "../../../models/inventory";
import {Sort} from "@pythias/labels";
export default async function Sublimation(){
    let sublimation = await Items.find({
        type: "sublimation",
        inBin: false,
        canceled: false,
        shipped: false,
        styleCode: {$ne: "POST"},
        paid: true,
        order: {$ne: null}
      }).lean()
    let epson = await Items.find({
        type: "sublimation",
        inBin: false,
        canceled: false,
        shipped: false,
        paid: true,
        styleCode: {$in: ["CST", "MSP",]},
        order: {$ne: null}
    }).lean()
    let buttons = await Items.find({
        styleCode: { $in: ["BTN", "MGN"] },
        inBin: false,
        canceled: false,
        shipped: false,
        paid: true,
        buttonPrinted: { $ne: true },
        order: {$ne: null},
        date: { $gt: new Date(Date.now() - 14 * (24 * 60 * 60 * 1000)) }
    }).lean()
    let giftMessages = await Items.find({
        type: "gift",
        sku: "gift-message",
        inBin: false,
        canceled: false,
        shipped: false,
        paid: true,
        order: {$ne: null}
    })
    let posters = await Items.find({
        type: "sublimation",
        inBin: false,
        canceled: false,
        shipped: false,
        styleCode: "POST",
        order: {$ne: null},
        paid: true,
      }).lean()
    let  premiumPoster = await Items.find({
        type: "sublimation",
        inBin: false,
        canceled: false,
        shipped: false,
        styleCode: "POST",
        sizeName: {$regex : "P"},
        order: {$ne: null},
        paid: true,
    }).lean()
    let  stickers = await Items.find({
        inBin: false,
        canceled: false,
        shipped: false,
        styleCode: "BUMP",
        order: {$ne: null},
        paid: true,
    }).lean()
    console.log(sublimation.length,  posters.length, premiumPoster.length, stickers.length, giftMessages.length, buttons.length, epson.length )
    let labels = {sublimation, posters, premiumPoster, stickers, giftMessages, buttons, epson}
    for(let k of Object.keys(labels)){
        let standardOrders = labels[k].map(s=> s.order)
        standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items")
        labels[k] = labels[k].map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0];  return {...s}})
        labels[k] = labels[k].filter(s=> s.order != undefined)
        let inventory_ids = labels[k].map(s=>{return encodeURIComponent(`${s.colorName}-${s.sizeName}-${s.styleCode}`);})
        let inventoryArray = await Inventory.find({
            inventory_id: { $in: inventory_ids },
            })
            .select("quantity pending_quantity inventory_id")
            .lean();
        labels[k] = labels[k].map(s=> { s.inventory = inventoryArray.filter(i=> i.inventory_id == `${s.colorName}-${s.sizeName}-${s.styleCode}`)[0];  return {...s}})
        //labels[k].map(l=>{console.log(l.inventory, `${l.colorName}-${l.sizeName}-${l.styleCode}`, k)})
        let missing = labels[k].filter(l=> l.inventory == undefined && l.styleCode != "BTN" && l.styleCode != "MGN" && l.styleCode != "BUMP" && l.styleCode != "POST" && l.styleCode != undefined)
        missing.map(async m=>{
            let i = await Inventory.findOne({inventory_id: `${m.colorName}-${m.sizeName}-${m.styleCode}`})
            if(!i){
                i = new Inventory({
                    inventory_id: `${m.colorName}-${m.sizeName}-${m.styleCode}`,
                    pending_quantity: 0,
                    quantity: 0,
                    order_at_quantity: 10,
                    desired_order_quantity: 10,
                    color: m.color,
                    color_name: m.colorName,
                    size_name: m.sizeName,
                    barcode_id: `${m.colorName}-${m.sizeName}-${m.styleCode}`
                })
                await i.save()
            }
        })
        labels[k] = await Sort(labels[k])
    }
    labels = JSON.parse(JSON.stringify(labels))
    return <Main labels={labels}/>
}