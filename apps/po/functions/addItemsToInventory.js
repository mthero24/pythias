import {Inventory} from "@pythias/mongo";
import Items from "@/models/Items";

const updateInventory = async () => {
    let inventories = await Inventory.find({  })
    inventories = inventories.sort((a, b) => a.label.localeCompare(b.label))
    for (let inv of inventories) {
        let items = await Items.find({ "inventory.inventory": inv._id, order: { $ne: null }, labelPrinted: false, canceled: false, shipped: false, paid: true }).populate("order", "poNumber")
        items = items.filter(i => i.order != null)
        if (inv.quantity < 0) {
            inv.quantity = 0;
        }
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
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
                await inv.save()
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                    await inv.save()
                }
            }
        } else {
            inv.inStock = [];
            inv.attached = [];
            await inv.save()
        }
    }
}

export async function addItemsToInventory(){
    let items = await Items.find({ labelPrinted: false, order: {$ne: null}, canceled: false, shipped: false, paid: true}).populate("order", "poNumber items")
    let cancel = items.filter(i => i.order == null)
    for (let c of cancel) {
        c.canceled = true;
        await c.save()
    }
    items = items.filter(i => i.order != null)
    if(items.length > 0){
        console.log(items.length, "items to add to inventory")
        for(let item of items){
            item.inventory = {
                inventoryType: "inventory",
                inventory: await Inventory.findOne({ inventory_id: encodeURIComponent(`${item.colorName}-${item.sizeName}-${item.styleCode}`) }),
                productInventory: null,
            }
            console.log(item.inventory.inventory, "inventory for item", item._id);
            await item.save()
        }
    }
    await updateInventory();
    
}

setInterval(() => {
    if (process.env.pm_id == 24 || process.env.pm_id == "24") addItemsToInventory();
}, 1000 * 60 * 30); // Run every hour