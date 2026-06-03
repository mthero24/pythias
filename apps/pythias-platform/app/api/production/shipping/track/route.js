import { NextResponse } from "next/server";
import { runTracking, runTrackingAll, trackOrder } from "@/functions/tracking";
import { PlatformOrder as Order } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        if (body.orderId) {
            await trackOrder(body.orderId);
            const order = await Order.findById(body.orderId).select("status shippingInfo").lean();
            return NextResponse.json({ error: false, order });
        }
        if (body.all) {
            const result = await runTrackingAll();
            return NextResponse.json({ error: false, ...result });
        }
        const result = await runTracking();
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}
