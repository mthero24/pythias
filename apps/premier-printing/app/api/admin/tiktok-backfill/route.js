import { NextResponse } from "next/server";
import { Order } from "@pythias/mongo";
import { shipOrderTikTok } from "@/functions/tikTok";

// One-time backfill: re-push fulfillment to TikTok for orders that were shipped at Premier (have a
// tracking number) but never got marked shipped on TikTok (the old fulfill call was failing
// silently). Gated by ?key=PYTHIAS_INTERNAL_KEY so it can be triggered without a session.
// GET /api/admin/tiktok-backfill?key=...&days=30&limit=50
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    if (!process.env.PYTHIAS_INTERNAL_KEY || searchParams.get("key") !== process.env.PYTHIAS_INTERNAL_KEY)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const days  = parseInt(searchParams.get("days")  || "30");
    const limit = parseInt(searchParams.get("limit") || "50");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
        marketplace: { $in: ["tik tok", "tiktok"] },
        uniquePo: { $regex: "tik_tok$" },
        "shippingInfo.labels.0.trackingNumber": { $exists: true, $ne: "" },
        "shippingInfo.shippedAt": { $gte: since },
    }).sort({ "shippingInfo.shippedAt": -1 }).limit(limit).populate("items").lean();

    const results = [];
    for (const order of orders) {
        const label = order.shippingInfo?.labels?.[0];
        const trackingNumber = label?.trackingNumber;
        const provider = label?.provider;
        if (!trackingNumber) { results.push({ poNumber: order.poNumber, ok: false, msg: "no tracking" }); continue; }
        const res = await shipOrderTikTok({ order, items: order.items ?? [], trackingNumber, provider })
            .catch((e) => ({ error: true, msg: e.message }));
        results.push({ poNumber: order.poNumber, tracking: trackingNumber, ok: !res?.error, msg: res?.error ? res.msg : "sent" });
    }

    return NextResponse.json({
        scanned: orders.length,
        sent:    results.filter((r) => r.ok).length,
        failed:  results.filter((r) => !r.ok).length,
        results,
    });
}
