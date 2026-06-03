import {Item } from "@pythias/mongo";
import {TrackLabels as TrackLabelsComponent, serialize} from "@pythias/backend";


export default async function TrackLabels(){
    try{
        let items = await Item.find({labelPrinted: true, shipped: false, canceled: false}).populate("order", "poNumber status date preShipped notes").sort({_id: 1}).lean();
        items = items.filter(item => item.order && item.order.status !== "canceled" && item.order.status !== "returned" && item.order.status !== "shipped" && item.order.status !== "Shipped");
        items = serialize(items)
        return <TrackLabelsComponent items={items} source="simplysage" />;
    }catch(e){
        console.log(e)
        return <TrackLabelsComponent items={[]} source="simplysage" />;
    }
}