import {Item } from "@pythias/mongo";
import {TrackLabels as TrackLabelsComponent, serialize} from "@pythias/backend";


export default async function TrackLabels(){
    let items = await Item.find({labelPrinted: true, shipped: false, canceled: false}).populate("designRef order").sort({_id: 1}).lean();
    items = serialize(items)
    return <TrackLabelsComponent items={items} source="imperial" />;
}