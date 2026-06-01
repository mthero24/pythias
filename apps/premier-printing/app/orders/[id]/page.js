import { serialize } from "@/functions/serialize";
import { Order, Blank } from "@pythias/mongo";
import { OrderMain } from "@pythias/backend";
import { notFound } from "next/navigation";
import mongoose from "mongoose";

export default async function OrderPage(req) {
    const params = await req.params;
    if (!mongoose.isValidObjectId(params.id)) notFound();

    const order = await Order.findOne({ _id: params.id }).populate("items").lean();
    if (!order) notFound();

    const blankIds   = [...new Set(order.items.map(i => i.blank).filter(Boolean))];
    const styleCodes = [...new Set(order.items.map(i => i.styleCode).filter(Boolean))];
    const blanks = await Blank.find({
        $or: [
            ...(blankIds.length   ? [{ _id:  { $in: blankIds   } }] : []),
            ...(styleCodes.length ? [{ code: { $in: styleCodes } }] : []),
        ],
    }).populate("colors").lean();

    return <OrderMain ord={serialize(order)} blanks={serialize(blanks)} />;
}