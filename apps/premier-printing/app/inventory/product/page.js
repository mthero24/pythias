import {ProductInventory, Design, Blank} from "@pythias/mongo"
import { ProductMain, getProductInventory } from "@pythias/inventory"
import { serialize } from "@pythias/backend"
export default async function ProductInventoryPage({searchParams}){
    let inventory
    let totalCount
    let blanks = await Blank.find({}).select("code colors sizes").populate("colors").lean()
    let { q, page, filter } = await searchParams;
    if(!page) page = 1
    if(q){
        let { inventories, count } = await getProductInventory({ q, page, filter: filter? JSON.parse(filter) : null })
        let ids = inventories.map(i => i._id)
        inventory = await ProductInventory.find({ _id: { $in: ids } }).populate("blank color").sort({quantity: -1})
        totalCount = count
    }
    else {
        filter = filter ? JSON.parse(filter) : {}
        let find = {}
        if(filter.blank) find.blankCode = filter.blank
        if(filter.color) find.colorName = filter.color
        if(filter.size) find.sizeName = filter.size
        console.log(find)
        inventory = await ProductInventory.find(find).populate("blank color").sort({quantity: -1}).skip((page - 1) * 50).limit(50)
        totalCount = await ProductInventory.countDocuments(find)
    }
    inventory = inventory.map(async i => {
        let size = i.blank?.sizes.find(s => s._id.toString() === i.size.toString() || s.name == i.sku.split("_")[2])
        let sku = i.sku.split("_").slice(3, i.sku.split("_").length).join("_")
        let design = await Design.findOne({ sku: i.sku.split("_").slice(3, i.sku.split("_").length).join("_")})
        return {sku: i.sku, _id: i._id, quantity: i.quantity, blank: i.blank, color: i.color, size: size, design}
    })
    inventory = await Promise.all(inventory)
    inventory = serialize(inventory)
    blanks = serialize(blanks)
    console.log(totalCount, "inventory")
    return <ProductMain inventory={inventory} q={q} totalCount={totalCount} p={page} blanks={blanks} fils={filter} />
}