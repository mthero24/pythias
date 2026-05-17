import Order from "@/models/Order";
import { Refund } from "@pythias/shipping";

export const dynamic = "force-dynamic";

export default async function ShippingLabels() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
        "shippingInfo.labels.delivered": { $in: [false, undefined] },
        date: { $gt: cutoff },
        status: { $ne: "Delivered" },
    })
        .sort({ date: 1 })
        .select("shippingInfo date poNumber status")
        .limit(400)
        .lean();

    return <Refund ords={JSON.parse(JSON.stringify(orders))} />;
}
