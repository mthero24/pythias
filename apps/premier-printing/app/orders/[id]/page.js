import { serialize } from "@/functions/serialize";
import Order from "@/models/Order";
import Blank from "@/models/Blanks";
import { OrderMain } from "@pythias/backend";
import { notFound } from "next/navigation";
import mongoose from "mongoose";

export default async function OrderPage(req) {
    const params = await req.params;
    if (!mongoose.isValidObjectId(params.id)) notFound();

    const order = await Order.findOne({ _id: params.id }).populate("items").lean();
    if (!order) notFound();

    const blankIds = [...new Set(order.items.map(i => i.blank).filter(Boolean))];
    const blanks = await Blank.find({ _id: { $in: blankIds } }).populate("colors").lean();

    return <OrderMain ord={serialize(order)} blanks={serialize(blanks)} />;
}