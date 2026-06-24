import { NextResponse } from "next/server";
import { retryNeedsFunding } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/internal/dropship-retry  (PM2 cron, gated by CRON_SECRET)
// Re-attempts dropship orders left "needs_funding" once the seller's wallet can cover them.
export async function POST(req) {
    const secret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const r = await retryNeedsFunding();
        console.log(`[dropship-retry] ${r.fulfilled}/${r.orders} order(s) fulfilled`);
        return NextResponse.json({ error: false, ...r });
    } catch (e) {
        console.error("[dropship-retry] fatal:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
