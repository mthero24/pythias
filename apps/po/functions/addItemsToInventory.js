import {Inventory} from "@pythias/mongo";
import Items from "@/models/Items";

const updateInventory = async () => {
    let inventories = await Inventory.find({  })
    for (let inv of inventories) {
        let items = await Items.find({ "inventory.inventory": inv._id, order: { $ne: null }, labelPrinted: false, canceled: false, shipped: false, paid: true })
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
        }
    }
}

export async function addItemsToInventory(){
    let items = await Items.find({labelPrinted: false, order: {$ne: null}, canceled: false, shipped: false, paid: true})
        console.log(items.length, "items to add to inventory")
        for(let item of items){
            item.inventory = {
                inventoryType: "inventory",
                inventory: await Inventory.findOne({style_code: item.styleCode, color_name: item.colorName, size_name: item.sizeName}),
                productInventory: null,
            }
            await item.save()
        }
        await updateInventory();
        return <h1>Test</h1>
    
}

setInterval(() => {
    if (process.env.pm_id == 24 || process.env.pm_id == "24") addItemsToInventory();
}, 1000 * 60 * 60); // Run every hour