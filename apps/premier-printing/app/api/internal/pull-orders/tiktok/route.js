import { NextResponse } from "next/server";
import { pullTikTokOrders } from "@/functions/tikTok";

// Manual / diagnostic trigger for the TikTok order pull only. Returns the per-stage
// counts (auths found, orders fetched, created/updated/failed) so we can see exactly
// where the pull stops without digging through PM2 logs.
//   GET  /api/internal/pull-orders/tiktok            (diagnostic, browser-friendly)
//   POST /api/internal/pull-orders/tiktok            (with x-cron-secret)
async function run() {
    const result = await pullTikTokOrders();
    console.log("[pull-orders/tiktok] result:", JSON.stringify(result));
    return result;
}

export async function GET() {
    try {
        return NextResponse.json(await run());
    } catch (e) {
        console.error("[pull-orders/tiktok] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message, stack: e.stack }, { status: 500 });
    }
}

export async function POST(req) {
    const secret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        return NextResponse.json(await run());
    } catch (e) {
        console.error("[pull-orders/tiktok] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
