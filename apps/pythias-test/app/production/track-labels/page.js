import { Items } from "@pythias/mongo";
import { TrackLabels as TrackLabelsComponent, serialize } from "@pythias/backend";

export default async function TrackLabels() {
    try {
        let items = await Items.find({
            labelPrinted: true,
            shipped: false,
            canceled: false,
            date: { $gte: new Date(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)) },
        }).populate("order", "poNumber status date preShipped notes shippingType").sort({ _id: 1 }).lean();
        items = items.filter(item =>
            item.order &&
            !["canceled", "returned", "shipped", "Shipped", "Delivered", "Complete"].includes(item.order.status)
        );
        items = serialize(items);
        return <TrackLabelsComponent items={items} source="PT" />;
    } catch (e) {
        console.log(e);
        return <TrackLabelsComponent items={[]} source="PT" />;
    }
}
