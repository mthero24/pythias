import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const showAll = url.searchParams.get("status") === "all";
    const PER_PAGE = 50;

    const statusFilter = showAll ? {} : { status: "awaiting_shipment" };
    const filter = q
        ? { orgId, ...statusFilter, $or: [{ poNumber: { $regex: q, $options: "i" } }, { orderId: { $regex: q, $options: "i" } }] }
        : { orgId, ...statusFilter };

    const [orders, count] = await Promise.all([
        PlatformOrder.find(filter).sort({ _id: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).populate("items").lean(),
        PlatformOrder.countDocuments(filter),
    ]);

    return NextResponse.json({ error: false, orders: JSON.parse(JSON.stringify(orders)), count });
}

export async function PATCH(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { orderId, update } = await req.json();
    const order = await PlatformOrder.findOneAndUpdate(
        { _id: orderId, orgId: token.orgId },
        update,
        { new: true },
    ).lean();

    return NextResponse.json({ error: false, order: JSON.parse(JSON.stringify(order)) });
}
