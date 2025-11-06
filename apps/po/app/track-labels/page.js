import {Item}  from "@pythias/mongo";
import {TrackLabels as TrackLabelsComponent, serialize} from "@pythias/backend";


export default async function TrackLabels(){
    try{
        let items = await Item.find({labelPrinted: true, shipped: false, canceled: false, date: {$gte: new Date(new Date(Date.now() - 7 * (24 * 60 * 60 * 1000)).setHours(0,0,0,0))}}).populate("order", "poNumber status date preShipped notes shippingType").sort({_id: 1}).lean();
        console.log("total items with printed labels:", items.length)
        items = items.filter(item => item.order && item.order.status !== "canceled" && item.order.status !== "returned" && item.order.status !== "shipped" && item.order.status !== "Shipped");
        items = serialize(items)
    
        return <TrackLabelsComponent items={items} source="PO" />;
    }catch(e){
        console.log(e)
        return <TrackLabelsComponent items={[]} source="PO" />;
    }
}