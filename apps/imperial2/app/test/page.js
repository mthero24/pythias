import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders} from "@pythias/mongo"
export default async function Test(){
    //await pullOrders()
    // let order = await InventoryOrders.findOne({poNumber: "PO 7-25-2025"})
    // console.log(order, "order")
    // for(let location of order.locations){
    //     for(let item of location.items){
    //         console.log(item, "item")
    //         let inv = await Inventory.findOne({_id: item.inventory})
    //         inv.pending_quantity = item.quantity;
    //         await inv.save()
    //         console.log(inv, "inv")
    //     }
    // }
    return <h1>test</h1>
}