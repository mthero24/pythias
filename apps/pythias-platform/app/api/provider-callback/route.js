import { NextResponse } from "next/server";
import { RoutingLog, PlatformOrder as Order, ProviderCapacity, Organization } from "@pythias/mongo";
import { notifyPartner } from "@/lib/notifyPartner";
import { shapeOrder } from "@/lib/partnerShape";

// Provider → platform status callback. A provider (e.g. Premier) calls this as it
// works a routed Commerce Cloud order so the platform can update the seller's order
// and notify their storefront. Server-to-server, secret-authed.
//
// Body: { providerOrderId, status, trackingNumber?, carrier?, shippingCost?, note? }
//   status: "in_production" | "shipped" | "delivered" | "cancelled"
//   shippingCost: provider's ACTUAL label cost in USD cents (on "shipped")

const PARTNER_EVENT = {
    in_production: "order.updated",
    shipped:       "order.shipped",
    delivered:     "order.delivered",
    cancelled:     "order.cancelled",
};
const ORDER_STATUS = {
    in_production: "in_production",
    shipped:       "shipped",
    delivered:     "delivered",
    cancelled:     "cancelled",
};

export async function POST(req) {
    const secret = req.headers.get("x-pythias-secret");
    if (!process.env.PROVIDER_INGEST_SECRET || secret !== process.env.PROVIDER_INGEST_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { providerOrderId, status } = body ?? {};
    if (!providerOrderId || !status) {
        return NextResponse.json({ error: "providerOrderId and status are required" }, { status: 400 });
    }
    if (!ORDER_STATUS[status]) {
        return NextResponse.json({ error: `unknown status: ${status}` }, { status: 400 });
    }

    const log = await RoutingLog.findOne({ providerOrderId });
    if (!log) return NextResponse.json({ error: "No routed order matches that providerOrderId" }, { status: 404 });

    // Idempotency — a provider may resend the same status. Never double-settle money.
    const alreadyApplied = log.fulfillmentStatus === status && (status !== "shipped" || log.settledAt);
    if (alreadyApplied) {
        return NextResponse.json({ success: true, alreadyProcessed: true, status: ORDER_STATUS[status] });
    }

    const order = await Order.findById(log.orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    order.status = ORDER_STATUS[status];
    log.fulfillmentStatus = status;

    let walletCharge = 0; // applied AFTER the saves so a failed save can't charge without persisting settlement
    if (status === "shipped") {
        const shippingPaid = Math.max(0, Math.round(Number(body.shippingCost ?? 0)) || 0); // cents
        // Provider's handling fee + the platform's cut of wholesale
        const cap        = await ProviderCapacity.findOne({ providerId: log.selectedProviderId }).select("handlingFee").lean();
        const handling   = cap?.handlingFee ?? 0;
        const sellerOrg  = await Organization.findById(log.commerceOrgId).select("fulfillmentPartner").lean();
        const feePercent = sellerOrg?.fulfillmentPartner?.platformFeePercent ?? 2;
        const wholesale  = log.totalWholesaleCost ?? 0;
        const platformFee = Math.round(wholesale * feePercent / 100);

        log.providerShippingPaid = shippingPaid;
        log.providerHandlingFee  = handling;
        log.platformFee          = platformFee;
        log.providerOwed         = wholesale + shippingPaid + handling - platformFee;
        log.settledAt            = new Date();
        log.trackingNumber       = body.trackingNumber;
        log.carrier              = body.carrier;
        log.shippedAt            = new Date();

        // Seller pays shipping + handling now (wholesale was charged at routing).
        walletCharge = shippingPaid + handling;

        if (body.trackingNumber) {
            order.shippingInfo = order.shippingInfo ?? {};
            order.shippingInfo.labels = order.shippingInfo.labels ?? [];
            order.shippingInfo.labels.push({
                trackingNumber: body.trackingNumber,
                provider: "Commerce Cloud",
                cost: shippingPaid,
            });
            order.shippingInfo.shippedAt = new Date();
        }
    } else if (status === "delivered") {
        log.deliveredAt = new Date();
    }

    // Persist status + settlement marker first; the idempotency guard above keys off
    // log.settledAt / fulfillmentStatus, so a retry after this point won't re-charge.
    await Promise.all([order.save(), log.save()]);
    if (walletCharge > 0) {
        await Organization.updateOne({ _id: log.commerceOrgId }, { $inc: { "wallet.balance": -walletCharge } });
    }

    // Notify the seller's storefront.
    const event = PARTNER_EVENT[status];
    if (event) notifyPartner(log.commerceOrgId, event, shapeOrder(order.toObject()));

    return NextResponse.json({ success: true, orderId: order._id.toString(), status: order.status });
}
