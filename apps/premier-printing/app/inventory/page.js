import { Item, Inventory, Blank as Blanks } from "@pythias/mongo";
import {serialize} from "@/functions/serialize";
import {Main} from "@pythias/inventory";
import {getInv} from "@pythias/inventory"
export const dynamic = 'force-dynamic'; 
export default async function InventoryPage (req){
    let items = await Item.find({
        blank: { $ne: null },
        colorName: { $ne: null },
        sizeName: { $ne: null },
        designRef: { $ne: null },
        design: { $ne: null },
        labelPrinted: false,
        canceled: false,
        paid: true,
        order: { $ne: null }
    }).populate("inventory.inventory inventory.productInventory").populate("order", "poNumber items marketplace date").lean()
    // console.log(items.length, "items to print")
    let notAttachedAndNotInOrder = 0
    for (let item of items) {
        if (item.inventory && item.inventory.inventoryType == "inventory" && item.inventory.inventory) {
            let inventory = await Inventory.findById(item.inventory.inventory)
            if (inventory) {
                if (!inventory.inStock) inventory.inStock = []
                if (inventory.quantity - inventory.inStock.length) {
                    if (!inventory.inStock.includes(item._id.toString()) && !inventory.attached.includes(item._id.toString()) && !inventory.orders.filter(o => o.items.includes(item._id.toString()))[0]) {
                        inventory.inStock.push(item._id)
                        await inventory.save()
                    }
                } else {

                    if (!inventory.inStock.includes(item._id.toString()) && !inventory.attached.includes(item._id.toString()) && !inventory.orders.filter(o => o.items.includes(item._id.toString()))[0]) {
                        //console.log("attaching item to inventory", item._id)
                        inventory.attached.push(item._id)
                    }
                    await inventory.save()
                }
            }
        }
    }
    let search = await req.searchParams;
    let page = search.page;
    let term = search.q;
    console.log(page, term, "search params in inventory page");
    if (page) {
        page = parseInt(page)
    } else page = 1
    let res = await getInv({ Blanks, Inventory, term, page })
    let combined = serialize(res.blanks)
    items = serialize(items)
    return <Main bla={combined} it={items} defaultLocation={"utah"} binType="row" pagination={true} cou={res.count} pa={page} q={term}/>
}