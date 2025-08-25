import {Item } from "@pythias/mongo";
import {TrackLabels as TrackLabelsComponent, serialize} from "@pythias/backend";


export default async function TrackLabels(){
    let items = await Item.find({labelPrinted: true, shipped: false, canceled: false}).populate("order", "poNumber status date preShipped notes").sort({_id: 1});
    console.log(items.length, "items.length")
    // for(let item of items){
    //     if(item.order == undefined || item.order.poNumber == undefined) {
    //         item.canceled = true;
    //     }
    //     console.log(item.order.status, item.order.status.toLowerCase().trim() == "shipped", !item.order?.preShipped, item.order?.status.toLowerCase().trim() == "shipped" && !item.order?.preShipped, "item.order.status")
    //     if(item.order?.status.toLowerCase().trim() == "shipped"){
    //         item.shipped = true;
    //     }
    //     await item.save();
    // }
    items = serialize(items)
    return <TrackLabelsComponent items={items} source="simplysage" />;
}