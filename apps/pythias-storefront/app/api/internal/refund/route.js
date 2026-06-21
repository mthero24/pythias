export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { storefrontStripe } from "@/lib/stripe";
import { logError } from "@pythias/backend/server";

// POST /api/internal/refund — refund a storefront order's payment (from platform/premier). Handles
// full OR partial (customer-service) refunds; cancellation is handled separately by /api/orders/cancel.
// The marketplace Stripe key + the seller-payout transfer live in the storefront app, so the money
// moves here. Body: { orderId, amountCents?, reason?, by? }  (amountCents omitted = full remaining)
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { orderId, amountCents, reason, by } = await req.json().catch(() => ({}));
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const order = await PlatformOrder.findById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.source !== "storefront") return NextResponse.json({ error: "Not a storefront order" }, { status: 400 });

    const totalCents = Math.round((order.total || 0) * 100);
    const already = order.refundedCents || 0;
    const remaining = Math.max(0, totalCents - already);
    // Default to the full remaining balance; clamp a requested amount to what's left.
    const cents = Math.min(remaining, Math.max(0, Math.round(Number(amountCents) || remaining)));
    if (cents <= 0) return NextResponse.json({ error: already > 0 ? "Order already fully refunded" : "Nothing to refund" }, { status: 400 });

    try {
        const stripe = storefrontStripe();
        if (!stripe) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
        if (!order.paymentRef) return NextResponse.json({ error: "No payment on this order to refund" }, { status: 400 });

        const refund = await stripe.refunds.create({ payment_intent: order.paymentRef, amount: cents });

        // Clawback: reverse the seller's payout for the refunded portion if it was already transferred.
        const transferId = order.storefrontPayout?.transferId;
        if (transferId) {
            try { await stripe.transfers.createReversal(transferId, { amount: Math.min(cents, order.storefrontPayout.subtotalCents || cents) }); }
            catch (e) { console.warn("[refund] payout clawback failed:", e.message); }
        }

        order.refundedCents = already + cents;
        order.refunds = order.refunds || [];
        order.refunds.push({ amountCents: cents, reason: reason || "customer_service", stripeRefundId: refund.id, by: by || "", at: new Date() });
        if (order.refundedCents >= totalCents && totalCents > 0) order.refunded = true;
        if (order.storefrontPayout?.transferId && order.refundedCents >= (order.storefrontPayout.subtotalCents || 0)) order.storefrontPayout.status = "clawed_back";
        await order.save();

        return NextResponse.json({ ok: true, refundId: refund.id, refundedCents: order.refundedCents, fullyRefunded: !!order.refunded });
    } catch (e) {
        logError({ error: e, app: "storefront", provider: "storefront", source: "api/internal/refund", route: "/api/internal/refund", method: "POST", status: 502, orgId: order.orgId, context: { orderId: String(orderId), amountCents: cents } });
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
