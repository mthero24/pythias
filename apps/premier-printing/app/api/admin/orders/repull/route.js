import { NextResponse } from "next/server";
import { repullOrderItems } from "@/functions/pullOrders";

export async function POST(req) {
    const { poNumber } = await req.json();
    if (!poNumber?.trim()) return NextResponse.json({ error: true, msg: "poNumber required" }, { status: 400 });

    try {
        const result = await repullOrderItems(poNumber.trim());
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[repull]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 400 });
    }
}
