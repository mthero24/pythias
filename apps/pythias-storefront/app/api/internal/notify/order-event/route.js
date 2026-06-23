export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder, PlatformItem, StorefrontSite, StorefrontCustomer, StorefrontFlow } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { enqueueOrderStatus, enqueueReviewRequest } from "@/lib/emailFlows";
import { enrollFlows } from "@/lib/flows";
import { storeBaseUrl } from "@/lib/marketing";

// POST /api/internal/notify/order-event  (from the platform provider-callback)
// Body: { orderId, status, trackingUrl? }
// Lifecycle statuses (shipped/delivered) prefer an editable automation flow if the seller has one
// active; otherwise we fall back to the built-in transactional email.
const TRIGGER_FOR = { shipped: "order_shipped", delivered: "order_delivered" };

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

    // This order's line items → a simple order summary + unique products to request reviews on.
    const items = await PlatformItem.find({ order: order._id, orgId: order.orgId }).select("product name styleCode quantity").lean();
    const seen = new Set();
    const reviewProducts = [];
    const summaryItems = [];
    for (const it of items) {
        const title = it.name || it.styleCode || "your item";
        summaryItems.push({ title, qty: it.quantity || 1 });
        const pid = it.product && String(it.product);
        if (pid && !seen.has(pid)) { seen.add(pid); reviewProducts.push({ id: pid, title }); }
    }

    const base = storeBaseUrl(site);
    const orderUrl = `${base}/account/orders/${order._id}`;
    const trigger = TRIGGER_FOR[status] || null;

    // Editable flow takes over when one is active for this event; otherwise transactional fallback.
    let usedFlow = false;
    if (trigger && order.storefrontCustomerId) {
        const hasFlow = await StorefrontFlow.exists({ orgId: order.orgId, trigger, active: true }).catch(() => null);
        if (hasFlow) {
            const customer = await StorefrontCustomer.findById(order.storefrontCustomerId).select("_id email phone name").lean();
            if (customer?._id) {
                const context = {
                    first_name: (customer.name || "").split(" ")[0] || "",
                    order_number: order.poNumber,
                    order_url: orderUrl,
                    tracking_url: trackingUrl || orderUrl,
                    items: summaryItems,
                    reviewProducts: reviewProducts.slice(0, 6),
                };
                await enrollFlows({ orgId: order.orgId, site, customer, trigger, token: String(order._id), context }).catch(() => {});
                usedFlow = true;
            }
        }
    }

    if (!usedFlow) {
        await enqueueOrderStatus(site, {
            orgId: order.orgId, orderId: String(order._id), poNumber: order.poNumber,
            email: order.customerEmail, customerId: order.storefrontCustomerId, status, trackingUrl,
        });
        // On delivery, ask for product reviews — a few days later (configurable factor; default 3).
        if (status === "delivered" && order.customerEmail && reviewProducts.length) {
            const d = Number(site.reviewRequestDelayDays);
            const delayDays = Number.isFinite(d) && d >= 0 ? d : 3;
            await enqueueReviewRequest(site, {
                orgId: order.orgId, orderId: String(order._id), email: order.customerEmail,
                customerId: order.storefrontCustomerId, products: reviewProducts,
                scheduledAt: new Date(Date.now() + delayDays * 24 * 3600 * 1000),
            }).catch(() => {});
        }
    }
    return NextResponse.json({ ok: true, via: usedFlow ? "flow" : "transactional" });
}
