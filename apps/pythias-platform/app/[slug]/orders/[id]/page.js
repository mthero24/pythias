import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PlatformOrder, PlatformBlank } from "@pythias/mongo";
import { OrderMain } from "@pythias/backend";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export default async function OrderPage(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const params = await req.params;
    if (!mongoose.isValidObjectId(params.id)) notFound();

    const order = await PlatformOrder.findOne({
        _id: params.id,
        orgId: session.user.orgId,
    })
        .populate("items")
        .lean();

    if (!order) notFound();

    const blankIds = [...new Set(order.items.map(i => i.blank).filter(Boolean))];
    const blanks = await PlatformBlank.find({
        _id: { $in: blankIds },
        orgId: session.user.orgId,
    }).lean();

    return (
        <OrderMain
            ord={JSON.parse(JSON.stringify(order))}
            blanks={JSON.parse(JSON.stringify(blanks))}
        />
    );
}
