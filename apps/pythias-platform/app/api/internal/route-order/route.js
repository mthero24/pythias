export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem, Organization } from "@pythias/mongo";
import { routeOrder } from "@/functions/routeOrder";
import { assertInternal } from "@/lib/internal";

// POST /api/internal/route-order  (server-to-server, from the storefront webhook)
// Body: { orderId }  →  { routed: true, providerId } | { unroutable, reason }
// Loads the already-placed order + items from the shared platform DB and runs the routing
// engine. routeOrder skips the wallet charge for source:"storefront" orders.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await PlatformOrder.findById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const org = await Organization.findById(order.orgId, "orgType wallet _id").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (org.orgType !== "commerce") {
        // Non-commerce orgs fulfill their own orders — nothing to route.
        return NextResponse.json({ routed: false, reason: "not_commerce" });
    }

    const items = await PlatformItem.find({ order: order._id });
    try {
        const result = await routeOrder(order, items, org);
        if (result?.unroutable) return NextResponse.json({ routed: false, unroutable: true, reason: result.reason });
        return NextResponse.json({ routed: true, providerId: String(result?.providerId || "") });
    } catch (e) {
        console.error(`[route-order] order ${orderId} failed:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
