import { serialize } from "@/functions/serialize";
import Order from "@/models/Order";
import Blank from "@/models/Blanks";
import { OrderMain } from "@pythias/backend";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { trackOrder } from "@/functions/tracking";

const SHIPPED_STATUSES = ["Shipped", "shipped", "Out For Delivery"];

export default async function OrderPage(req) {
    const params = await req.params;
    if (!mongoose.isValidObjectId(params.id)) notFound();

    let order = await Order.findOne({ _id: params.id }).select("status").lean();
    if (!order) notFound();

    if (SHIPPED_STATUSES.includes(order.status)) {
        await trackOrder(params.id);
    }

    order = await Order.findOne({ _id: params.id }).populate("items").lean();

    const blanks = await Blank.find({}).populate("colors").lean();
    return <OrderMain ord={serialize(order)} blanks={serialize(blanks)} />;
}