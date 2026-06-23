import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformOrder as Order } from "@pythias/mongo";
import { shapeOrder } from "@/lib/partnerShape";
import { notifyPartner } from "@/lib/notifyPartner";

const isObjectId = (v) => /^[a-f0-9]{24}$/i.test(v ?? "");

// Fulfillment-status ladder a self-fulfilling seller can move an order through.
const ALLOWED_STATUSES = new Set([
    "awaiting_shipment", "in_production", "on_hold", "shipped", "delivered", "cancelled",
]);

// GET /api/partner/orders/:orderId
// Accepts the Mongo _id, the orderId, or the poNumber — all scoped to this org.
export async function GET(req, { params }) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { orderId } = await params;
    const key = decodeURIComponent(orderId ?? "").trim();
    if (!key) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const or = [{ orderId: key }, { poNumber: key }];
    if (isObjectId(key)) or.push({ _id: key });

    const order = await Order.findOne({ orgId, $or: or })
        .populate("items", "sku name colorName sizeName styleCode quantity status price discount discountName")
        .lean();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ order: shapeOrder(order) });
}

// PATCH /api/partner/orders/:orderId
// Inbound fulfillment update from a self-fulfilling seller's own system (3PL/ERP/script).
// Body: { status?, trackingNumber?, carrier? } — sets the order status and/or appends tracking,
// then fires the matching lifecycle webhook so any other integration stays in sync.
export async function PATCH(req, { params }) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { orderId } = await params;
    const key = decodeURIComponent(orderId ?? "").trim();
    if (!key) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { status, trackingNumber, carrier, provider } = body;

    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ error: `Invalid status. Allowed: ${[...ALLOWED_STATUSES].join(", ")}` }, { status: 400 });
    }
    if (status === undefined && !trackingNumber) {
        return NextResponse.json({ error: "Provide a status and/or trackingNumber" }, { status: 400 });
    }

    const or = [{ orderId: key }, { poNumber: key }];
    if (isObjectId(key)) or.push({ _id: key });

    const order = await Order.findOne({ orgId, $or: or }).populate("items");
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const beforeStatus = order.status;
    if (status !== undefined) order.status = status;
    if (trackingNumber) {
        // Match the in-app shipped route's shape: trackingInfo.labels[] of { trackingNumber, provider }.
        if (!order.trackingInfo || Array.isArray(order.trackingInfo)) order.trackingInfo = {};
        if (!order.trackingInfo.labels) order.trackingInfo.labels = [];
        order.trackingInfo.labels.push({ trackingNumber, provider: carrier || provider || null });
        order.markModified("trackingInfo");
    }
    await order.save();

    const event = order.status === "shipped" ? "order.shipped"
        : order.status === "delivered" ? "order.delivered"
        : order.status === "cancelled" ? "order.cancelled"
        : "order.updated";
    try { notifyPartner(orgId, event, shapeOrder(order.toObject())); } catch { /* best-effort webhook */ }

    return NextResponse.json({ ok: true, before: beforeStatus, status: order.status, order: shapeOrder(order.toObject()) });
}
