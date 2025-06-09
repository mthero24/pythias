import Inventory from "@/models/inventory";
import Blanks from "@/models/Blanks";
import Items from "@/models/Items";
import {serialize} from "@/functions/serialize";
import {Main} from "@pythias/inventory";
export const dynamic = 'force-dynamic'; 
export default async function InventoryPage (){
    let inventory = await Inventory.find({}).populate("color").select("color color_name pending_quantity size_name blank quantity order_at_quantity quantity_to_order location")
    let items = await Items.find({labelPrinted: false, status: "awaiting_shipment"}).select("colorName sizeName blank")
    console.log("inventory", inventory.length)
    let blanks = await Blanks.find({}).populate("colors").select("code name colors sizes department")
    let combined = []
    for(let blank of blanks){
        blank.inventory = inventory.filter(i=> i.blank.toString() == blank._id.toString())
        combined.push({blank, inventories: blank.inventory})
    }
    console.log(combined)
    combined = serialize(combined)
    items = serialize(items)
    return <Main bla={combined} it={items}/>
}