import { Items, Order } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { OrdersSearch } from "@/functions/ordersSearch";

export async function POST(req) {
    const { search } = await req.json();
    if (!search?.trim()) return NextResponse.json({ error: false, orders: [] });

    // Try pieceId first — Items live in a separate collection, Atlas Search on Orders won't find them
    const items = await Items.find({ pieceId: { $regex: search.trim(), $options: "si" } })
        .select("order").lean();

    if (items.length > 0) {
        const orderIds = items.map(i => i.order);
        const { orders } = await OrdersSearch({ Order, orderIds });
        return NextResponse.json({ error: false, orders });
    }

    // All other searches go through OrdersSearch (Atlas Search when q > 2 chars, regex fallback otherwise)
    const { orders } = await OrdersSearch({ Order, q: search.trim() });
    return NextResponse.json({ error: false, orders });
}
