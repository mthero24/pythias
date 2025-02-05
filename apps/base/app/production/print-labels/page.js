import Items from "../../../models/Items";
import Order from "../../../models/Order";
import Inventory from "../../../models/inventory";
import Batches from "../../../models/batches";
import {Main} from "@pythias/labels"
export default async function PrintLabels(){
    let labels = {
            Standard: await Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            paid: true,
            shippingType: "Standard",
            type: { $nin: ["sublimation", "gift"] },
        }).lean(),
            Expedited: await Items.find({
            styleV2: { $ne: undefined },
            labelPrinted: false,
            canceled: false,
            paid: true,
            type: { $nin: ["sublimation", "gift"] },
            shippingType: { $ne: "Standard" },
        }).lean()
    }
    let rePulls = 0
    for(let k of Object.keys(labels)){
        let standardOrders = labels[k].map(s=> s.order)
        standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber")
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
        let missing = labels[k].filter(l=> l.inventory == undefined)
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
        rePulls += labels[k].filter(l=> l.rePulled).length
        labels[k] = labels[k].sort((a,b)=>{
            if(a.styleCode.toUpperCase() > b.styleCode.toUpperCase()) return 1
            if(a.styleCode.toUpperCase() < b.styleCode.toUpperCase()) return -1
            if(a.colorName.toUpperCase() > b.colorName.toUpperCase()) return 1
            if(a.colorName.toUpperCase()< b.colorName.toUpperCase()) return -1
            if(a.sizeName.toUpperCase() > b.sizeName.toUpperCase()) return 1
            if(a.sizeName.toUpperCase() < b.sizeName.toUpperCase()) return -1
            return 0  
        })
    }
    let giftMessages = JSON.parse(JSON.stringify(await Items.find({
        labelPrinted: false,
        canceled: false,
        paid: true,
        type: "gift",
        sku: { $in: ["gift-bag", "gift-message"] },
      })))
    if(labels) labels = JSON.parse(JSON.stringify(labels))
    let batches = JSON.parse(
      JSON.stringify(await Batches.find({}).limit(20).sort({ _id: -1 }).lean())
    );
    return <Main labels={labels} giftLabels={giftMessages} rePulls={rePulls} batches={batches}/>
}