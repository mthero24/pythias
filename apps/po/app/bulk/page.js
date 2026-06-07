import Order from "../../models/Order";
import { serialize } from "@pythias/backend";
import { BulkMain } from "@pythias/labels";
import { getShippingCreds } from "@/lib/getShippingCreds";
export const dynamic = 'force-dynamic';
export default async function Bulk() {
    const [orders, sc] = await Promise.all([
        Order.find({ bulk: true, canceled: false, status: { $nin: ["Canceled", "returned", "shipped", "Shipped", "Delivered", "payment failed", "Payment Failed"] }, bulkPrinted: { $in: [false, null] } })
            .populate({ path: "items", populate: { path: "inventory.inventory" } })
            .lean(),
        getShippingCreds(),
    ]);
    for (const order of orders) {
        order.items = order.items.filter(item => item.canceled == false);
    }
    return <BulkMain orders={serialize(orders)} printers={sc.labelPrinters} picklistPrinters={sc.picklistPrinters} />;
}