
import Styles from "@/models/StyleV2"
import Design from "@/models/Design"
import Colors from "@/models/Color"
import { Inventory, InventoryOrders } from "@pythias/mongo";
import Items from "@/models/Items";
import Order from "@/models/Order";
import { addItemsToInventory } from "@/functions/addItemsToInventory";
import { LabelsData } from "@/functions/labels";
const updateInventory = async (invIds) => {
    let inventories = await Inventory.find({ }).select("style_code _id")
    inventories = inventories.sort((a, b) => a.style_code?.localeCompare(b.style_code))
    console.log(inventories.length, "inventories")
    let total = 0
    for (let inv1 of inventories) {
        let inv = await Inventory.findOne({ _id: inv1._id })
        //console.log(inv.inventory_id)
        let items = await Items.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
         items = await Promise.all(items.map(async i=> {
            i.order = await Order.findOne({ _id: i.order });
            return i;
        }));
        if(!inv.quantity) inv.quantity = 0
        if (inv.quantity < 0) {
            inv.quantity = 0;
        }
        inv.inStock = [];
        inv.attached = [];
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => !itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => !itemIds.includes(i.toString()));
            if (inv.quantity > 0) {
                if (inv.quantity > inv.inStock.length + inv.attached.length) {
                    inv.attached = [];
                }
            }
            let newInStck = [];
            for (let id of inv.inStock) {
                if (!newInStck.includes(id) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(id)) {
                    newInStck.push(id);
                }
            }
            inv.inStock = newInStck;
            let newAttached = [];
            for (let id of inv.attached) {
                if (!newAttached.includes(id) && !inv.inStock.includes(id)) {
                    newAttached.push(id);
                }
            }
            inv.attached = newAttached;
            
            if (inv.quantity > 0) {
                for (let item of items) {
                    if (inv.quantity - inv.inStock.length > 0 && !inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString())
                    } else if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString())
                    }
                }
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                }
            }
            console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
        }
        total += inv.attached.length
        inv = await inv.save()
    }
    console.log("total: ", total)
}
export default async function Test(){
    // let { labels, giftMessages, rePulls, batches } = await LabelsData()
    // for(let s of labels.Standard){
    //     let inv = await Inventory.findOne({ inventory_id: encodeURIComponent(`${s.colorName}-${s.sizeName}-${s.styleCode}`) })
    //     if(inv){
    //         inv.quantity = inv.quantity + 2
    //         await inv.save()
    //     }
    // }
   // await addItemsToInventory()
    return <h1>Test</h1>
}