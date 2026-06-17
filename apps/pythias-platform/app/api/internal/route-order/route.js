export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem, Organization } from "@pythias/mongo";
import { routeOrder } from "@/functions/routeOrder";
import { routeDropship, routeWarehouse } from "@/functions/routeAltVerticals";
import { assertInternal } from "@/lib/internal";
import { logError } from "@pythias/backend/server";

// POST /api/internal/route-order  (server-to-server, from the storefront webhook)
// Body: { orderId }  →  { routed, groups: [...] }
// Loads the already-placed order + items, SPLITS them by fulfillment vertical, and routes each
// group to its fulfiller: POD → provider routing engine, dropship → supplier, warehouse → FBP.
// One cart can mix all three — something a single-fulfiller platform can't natively do.
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

    // Split by vertical (default "pod" → unchanged behavior for existing all-POD orders).
    const buckets = { pod: [], dropship: [], warehouse: [] };
    for (const it of items) (buckets[it.vertical] || buckets.pod).push(it);

    try {
        const groups = [];
        let anyRouted = false;

        if (buckets.pod.length) {
            const r = await routeOrder(order, buckets.pod, org);
            const routed = !r?.unroutable;
            anyRouted = anyRouted || routed;
            groups.push({ vertical: "pod", handler: "provider", status: routed ? "routed" : "unroutable", itemCount: buckets.pod.length, ref: String(r?.providerId || ""), reason: r?.reason });
        }
        if (buckets.dropship.length) { groups.push(await routeDropship(order, buckets.dropship, org)); anyRouted = true; }
        if (buckets.warehouse.length) { groups.push(await routeWarehouse(order, buckets.warehouse, org)); anyRouted = true; }

        order.fulfillmentGroups = groups;
        await order.save();

        const podGroup = groups.find((g) => g.vertical === "pod");
        return NextResponse.json({ routed: anyRouted, groups, providerId: podGroup?.ref || "", unroutable: groups.length === 1 && podGroup?.status === "unroutable", reason: podGroup?.reason });
    } catch (e) {
        logError({ error: e, app: "platform", provider: "platform", source: "api/internal/route-order POST", context: { orderId, orgId: order?.orgId?.toString() } });
        console.error(`[route-order] order ${orderId} failed:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
