import { NextResponse } from "next/server";
import { getNewOrders, acknowledgeOrders, listOrders } from "@/functions/channelEngine";

// GET /api/admin/channelengine/orders?status=IN_PROGRESS&page=0&pageSize=50
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "";
        const page = searchParams.get("page") || "0";
        const pageSize = searchParams.get("pageSize") || "50";

        const params = {};
        if (status) params["statuses[]"] = status;
        params.pageIndex = page;
        params.pageSize = pageSize;

        const result = await listOrders(params);
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[channelengine/orders GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// POST /api/admin/channelengine/orders — pull new orders and acknowledge all
export async function POST() {
    try {
        const newOrdersRes = await getNewOrders();
        const orders = newOrdersRes?.Content ?? [];

        if (orders.length > 0) {
            const acks = orders.map((o, i) => ({
                ChannelOrderNo: o.ChannelOrderNo ?? o.Id ?? String(i),
                MerchantOrderNo: `CE-${o.ChannelOrderNo ?? o.Id ?? i}`,
                Type: "CONFIRM",
            }));
            await acknowledgeOrders(acks);
        }

        return NextResponse.json({ error: false, count: orders.length, orders });
    } catch (e) {
        console.error("[channelengine/orders POST]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
