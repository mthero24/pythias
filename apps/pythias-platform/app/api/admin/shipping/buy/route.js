import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getShipmentRate, buyShippingLabel } from "@pythias/backend/server";
import { Organization, PlatformOrder } from "@pythias/mongo";
import { notifyStorefrontOrderEvent } from "@/lib/notifyStorefrontOrderEvent";

export const dynamic = "force-dynamic";

// POST /api/admin/shipping/buy  Body: { orderId, shipmentId, rateId }
// Buys the chosen label, charges the org wallet (carrier cost + spread), saves label+tracking on the
// order, marks it shipped (one action), and tells the storefront to email the buyer.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;
    const { orderId, shipmentId, rateId } = await req.json().catch(() => ({}));
    if (!orderId || !shipmentId || !rateId) return NextResponse.json({ error: "orderId, shipmentId and rateId are required" }, { status: 400 });

    try {
        const order = await PlatformOrder.findOne({ _id: orderId, orgId }).select("_id poNumber shippingInfo status marketplaceShipped");
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        if (order.shippingInfo?.labels?.length) return NextResponse.json({ error: "A label was already purchased for this order." }, { status: 409 });

        const org = await Organization.findById(orgId).select("wallet shippingLabels");
        if (!org?.shippingLabels?.enabled) return NextResponse.json({ error: "Shipping labels aren't enabled for this account." }, { status: 400 });

        // Wallet pre-check (carrier cost + spread) before spending money at the carrier.
        const quote = await getShipmentRate(shipmentId, rateId);
        const balance = org.wallet?.balance || 0;
        if (balance < quote.billedCents) {
            return NextResponse.json({ error: `This label costs $${(quote.billedCents / 100).toFixed(2)} but your wallet balance is $${(balance / 100).toFixed(2)}. Add funds and try again.`, code: "insufficient" }, { status: 402 });
        }

        const label = await buyShippingLabel({ shipmentId, rateId });

        // Charge the wallet for what we actually paid + the spread.
        await Organization.updateOne({ _id: orgId }, { $inc: { "wallet.balance": -label.billedCents } });

        // Save label + tracking; mark shipped (buying the label IS shipping the order).
        order.shippingInfo = order.shippingInfo || {};
        order.shippingInfo.labels = order.shippingInfo.labels || [];
        order.shippingInfo.labels.push({ trackingNumber: label.trackingCode, label: label.labelUrl, cost: label.costCents / 100, provider: label.carrier });
        order.shippingInfo.shippedAt = new Date();
        order.shippingInfo.shippingCost = (order.shippingInfo.shippingCost || 0) + label.costCents / 100;
        order.status = "shipped";
        order.marketplaceShipped = true;
        await order.save();

        // Storefront emails the buyer (shipped + tracking). Best-effort.
        notifyStorefrontOrderEvent({ orderId: String(order._id), status: "shipped", trackingUrl: label.trackingUrl }).catch(() => {});

        return NextResponse.json({
            ok: true, labelUrl: label.labelUrl, trackingCode: label.trackingCode, trackingUrl: label.trackingUrl,
            carrier: label.carrier, service: label.service, billedCents: label.billedCents, walletBalance: balance - label.billedCents,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
