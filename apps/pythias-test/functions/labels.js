import {Item as Items, Order, Inventory, Batches} from "@pythias/mongo";
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
            paid: true,
            shippingType: {$in: ["Standard", "Economy shipping"]},
        }).populate("color", "name _id").populate("designRef", "sku name printType").populate("order", "poNumber").populate("inventory.inventory").lean(),
            Expedited: await Items.find({
            blank: { $ne: undefined },
            colorName: {$ne: null},
            sizeName: {$ne: null},
            designRef: {$ne: null},
            design: {$ne: null},
            labelPrinted: false,
            paid: true,
            shippingType: { $nin: ["Standard", "Economy shipping"] },
        }).populate("color", "name _id").populate("designRef", "sku name printType").populate("order", "poNumber").populate("inventory.inventory").lean()
    }
    //console.log(labels)
    let inventoryArray = await Inventory.find({}).select("quantity pending_quantity inventory_id color_name size_name blank  style_code row unit shelf bin color blank").lean();
    let rePulls = 0
    for(let k of Object.keys(labels)){
        labels[k] = labels[k].map(s=> { if(s.designRef?.printType =="EMB"){
            s.type = "EMB"
        }else if(s.designRef?.sku.toUpperCase().includes("PU") || s.designRef?.sku.toUpperCase().includes("GL") || s.designRef?.printType =="VIN"){
            s.type = "VIN"
        }else{
            s.type = "DTF"
        };  return {...s}})
        labels[k] = labels[k].map(s=> { s.inventory = inventoryArray.filter(i=> i.color.toString() == s.color._id.toString() && i.size_name == s.sizeName && i.style_code == s.styleCode)[0];  return {...s}})
        //labels[k].map(l=>{console.log(l.inventory, `${l.color.name}-${l.sizeName}-${l.styleCode}`, k)})
        // let missing = labels[k].filter(l=> l.inventory == undefined)
        // missing.map(async m=>{
        //     let i = await Inventory.findOne({color_name: )})
        //     if(!i){
        //         i = new Inventory({
        //             inventory_id: encodeURIComponent(`${m.colorName}-${m.sizeName}-${m.styleCode}`),
        //             pending_quantity: 0,
        //             quantity: 0,
        //             order_at_quantity: 10,
        //             desired_order_quantity: 10,
        //             color: m.color,
        //             color_name: m.colorName,
        //             size_name: m.sizeName,
        //             barcode_id: encodeURIComponent(`${m.colorName}-${m.sizeName}-${m.styleCode}`)
        //         })
        //         await i.save()
        //     }
        // })
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