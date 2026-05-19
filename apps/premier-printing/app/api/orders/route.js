import { Order } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { OrdersSearch } from "@/functions/ordersSearch";

export async function POST(req) {
    const { search } = await req.json();
    if (!search?.trim()) return NextResponse.json({ error: false, orders: [] });

    const { orders, count } = await OrdersSearch({ Order, q: search.trim() });
    console.log(`[orders POST] q="${search.trim()}" → ${orders.length} orders (total ${count})`);
    return NextResponse.json({ error: false, orders });
}
