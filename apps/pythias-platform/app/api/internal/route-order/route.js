export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem, Organization } from "@pythias/mongo";
import { routeOrder } from "@/functions/routeOrder";
import { routeDropship, routeWarehouse } from "@/functions/routeAltVerticals";
import { assertInternal } from "@/lib/internal";
import { logError, findCjDropshipItems, fulfillCjDropshipOrder } from "@pythias/backend/server";
import { notifyPartner } from "@/lib/notifyPartner";
import { shapeOrder } from "@/lib/partnerShape";

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

    const org = await Organization.findById(order.orgId, "orgType wallet _id autoDropship").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    // Load the order's items once. If the seller opted into auto-dropship, supplier-ship any CJ-sourced
    // catalog items straight to the buyer right here — those items are then excluded from fulfiller
    // routing. Runs for every org type (a storefront seller can dropship too) and never throws into the
    // order flow (the buyer already paid).
    const allItems = await PlatformItem.find({ order: order._id });
    const dropshipGroups = [];
    const dropshippedIds = new Set();
    if (org.autoDropship?.enabled) {
        try {
            const cjItems = await findCjDropshipItems(allItems);
            if (cjItems.length) {
                const g = await fulfillCjDropshipOrder(order, cjItems, org);
                if (g) dropshipGroups.push(g);
                cjItems.forEach((c) => dropshippedIds.add(String(c.item._id)));
            }
        } catch (e) {
            console.error(`[route-order] CJ dropship failed for ${orderId}:`, e.message);
        }
    }
    const items = allItems.filter((it) => !dropshippedIds.has(String(it._id)));

    if (org.orgType !== "commerce") {
        // Non-commerce orgs fulfill their own orders — we never route to our fulfillers.
        // A standalone storefront seller self-fulfills; if they've set up their own order webhook,
        // push the new order there (notifyPartner no-ops unless their webhook is active). We do NOT
        // touch Commerce/Fulfillment Cloud routing for them (CJ dropship above already ran, if opted in).
        if (org.orgType === "storefront") {
            try {
                await notifyPartner(order.orgId, "order.received", shapeOrder({ ...order.toObject(), items: items.map((i) => (i.toObject ? i.toObject() : i)) }));
            } catch (e) {
                console.error(`[route-order] storefront order.received webhook failed for ${orderId}:`, e.message);
            }
        }
        if (dropshipGroups.length) { order.fulfillmentGroups = [...(order.fulfillmentGroups || []), ...dropshipGroups]; await order.save(); }
        return NextResponse.json({ routed: dropshipGroups.some((g) => g.status === "ordered"), groups: dropshipGroups, reason: "not_commerce" });
    }

    // Split by vertical (default "pod" → unchanged behavior for existing all-POD orders).
    const buckets = { pod: [], dropship: [], warehouse: [] };
    for (const it of items) (buckets[it.vertical] || buckets.pod).push(it);

    try {
        const groups = [...dropshipGroups];
        let anyRouted = dropshipGroups.some((g) => g.status === "ordered");

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
