import { NextResponse } from "next/server";
import { pullOrders } from "@/functions/pullOrders";

export async function POST(req) {
    const secret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        console.log("[pull-orders] triggered via PM2 cron");
        await pullOrders();
        return NextResponse.json({ error: false });
    } catch (e) {
        console.error("[pull-orders] fatal:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
