
import Styles from "@/models/StyleV2"
import Design from "@/models/Design"
import Colors from "@/models/Color"
import { getCarriers } from "@pythias/shipping"
import { Inventory, InventoryOrders } from "@pythias/mongo";
import Items from "@/models/Items";
import Order from "@/models/Order";
const updateInventory = async (invIds) => {
    let inventories = await Inventory.find({ })
    inventories = inventories.sort((a, b) => a.style_code?.localeCompare(b.style_code))
    console.log(inventories.length, "inventories")
    let total = 0
    for (let inv of inventories) {
        let items = await Items.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
         items = await Promise.all(items.map(async i=> {
            i.order = await Order.findOne({ _id: i.order });
            return i;
        }));
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
            console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
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
        }
        console.log(inv.attached.length)
        total += inv.attached.length
        await inv.save()
    }
    console.log("total: ", total)
}
export default async function Test(){
    // let items = await Items.find({ labelPrinted: false, "inventory.inventory": {$eq: null}, order: { $ne: null }, canceled: false, shipped: false, paid: true })
    // items = await Promise.all(items.map(async i=> {
    //     i.order = await Order.findOne({ _id: i.order });
    //     return i;
    // }));
    // console.log(items.length, "items to add to inventory")
    // let cancel = items.filter(i=> i.order == null)
    // for(let c of cancel){
    //     c.canceled = true;
    //     await c.save()
    // }
    // items = items.filter(i => i.order != null)
    // for(let item of items){
    //     item.inventory = {
    //         inventoryType: "inventory",
    //         inventory: await Inventory.findOne({ inventory_id: encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`) }),
    //         productInventory: null,
    //     }
    //     await item.save()
    // }
    // await updateInventory();
    // let invOrder = await InventoryOrders.findOne({_id: "68af572573d1de811e6e3098"}).populate("locations.items.inventory")
    // for(let loc of invOrder.locations){
    //     for(let item of loc.items){
    //         //console.log(item)
    //         let labels = await Items.find({"inventory.inventory": item.inventory._id, labelPrinted: false, canceled: false, paid: true }).sort({_id: -1}).limit(item.quantity)
    //         console.log(labels.length, item.quantity)
    //         item.inventory.orders.push({
    //             order: invOrder._id.toString(),
    //             items: labels.map(l=> l._id.toString())
    //         })
    //         await item.inventory.save()
    //     }
    // }
    return <h1>Test</h1>
}