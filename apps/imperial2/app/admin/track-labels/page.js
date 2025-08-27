import {Item } from "@pythias/mongo";
import {TrackLabels as TrackLabelsComponent, serialize} from "@pythias/backend";


export default async function TrackLabels(){
    //let items = await Item.find({labelPrinted: true, shipped: false, canceled: false}).populate("order", "poNumber status date preShipped notes").sort({_id: 1});
    //console.log(items.length, "items.length")
    // for(let item of items){
    //     if(item.order == undefined || item.order.poNumber == undefined) {
    //         item.canceled = true;
    //     }
    //     console.log(item.order, item.order?.preShipped, "item.order.status")
    //     if(item.order?.status.toLowerCase() == "shipped" && !item.order?.preShipped){
    //         item.shipped = true;
    //     }
    //     await item.save();
    // }
    //items = serialize(items)
    return <TrackLabelsComponent items={[]} source="imperial" />;
}