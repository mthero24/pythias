import Order from "@/models/Order";
import { OrderMain } from "@pythias/backend";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { trackOrder } from "@/functions/tracking";

const SHIPPED_STATUSES = ["Shipped", "shipped", "Out For Delivery"];

export default async function OrderDetailPage(req) {
    const params = await req.params;
    if (!mongoose.isValidObjectId(params.id)) notFound();

    let order = await Order.findOne({ _id: params.id }).select("status").lean();
    if (!order) notFound();

    if (SHIPPED_STATUSES.includes(order.status)) {
        await trackOrder(params.id);
    }

    order = await Order.findOne({ _id: params.id }).populate({ path: "items", populate: { path: "styleV2" } }).lean();

    return <OrderMain ord={JSON.parse(JSON.stringify(order))} blanks={[]} source="PO" />;
}
