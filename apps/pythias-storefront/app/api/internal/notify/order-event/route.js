export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem, StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { enqueueOrderStatus, enqueueReviewRequest } from "@/lib/emailFlows";

// POST /api/internal/notify/order-event  (from the platform provider-callback)
// Body: { orderId, status, trackingUrl? } → enqueues the buyer's order-status email.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json().catch(() => null);
    const { orderId, status, trackingUrl } = body || {};
    if (!orderId || !status) return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });

    const order = await PlatformOrder.findById(orderId).select("orgId poNumber customerEmail storefrontCustomerId").lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const site = await StorefrontSite.findOne({ orgId: order.orgId }).lean();
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    await enqueueOrderStatus(site, {
        orgId: order.orgId, orderId: String(order._id), poNumber: order.poNumber,
        email: order.customerEmail, customerId: order.storefrontCustomerId, status, trackingUrl,
    });

    // On delivery, ask for product reviews.
    if (status === "delivered" && order.customerEmail) {
        const items = await PlatformItem.find({ order: order._id, orgId: order.orgId, product: { $exists: true } })
            .select("product name styleCode").lean();
        const seen = new Set();
        const products = [];
        for (const it of items) {
            const pid = String(it.product);
            if (it.product && !seen.has(pid)) { seen.add(pid); products.push({ id: pid, title: it.name || it.styleCode || "your item" }); }
        }
        if (products.length) {
            await enqueueReviewRequest(site, {
                orgId: order.orgId, orderId: String(order._id), email: order.customerEmail,
                customerId: order.storefrontCustomerId, products,
            }).catch(() => {});
        }
    }
    return NextResponse.json({ ok: true });
}
