import { Order } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { OrdersSearch } from "@/functions/ordersSearch";

export async function POST(req) {
    const { search } = await req.json();
    if (!search?.trim()) return NextResponse.json({ error: false, orders: [] });

    const { orders } = await OrdersSearch({ Order, q: search.trim() });
    return NextResponse.json({ error: false, orders });
}
