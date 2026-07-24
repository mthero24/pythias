import { NextResponse } from "next/server";
import { Order, Organization } from "@pythias/mongo";
import { completeInvoiceOrder } from "@/functions/completeInvoiceOrder";
import Stripe from "stripe";

// POST /api/pay/verify { t, sessionId } — PUBLIC. Confirms the Stripe Checkout session is paid on
// the seller's connected account, then marks the order paid + awaiting_shipment. Safe to call by
// anyone: it only acts when Stripe reports payment_status === "paid" for a session whose
// metadata.orderId matches the order found by the (unguessable) invoice token.
export async function POST(request) {
    try {
        const { t, sessionId } = await request.json();
        if (!t || !sessionId) return NextResponse.json({ error: "Missing token" }, { status: 400 });

        const order = await Order.findOne({ invoiceToken: t });
        if (!order) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        const org       = await Organization.findOne({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" }).select("name storefrontConnect").lean();
        const acctId    = org?.storefrontConnect?.accountId;
        const brandName = org?.name || "Premier Printing";
        const poNumber  = order.poNumber || order.orderId;
        if (!acctId) return NextResponse.json({ error: "Payout account not found" }, { status: 400 });

        if (order.paid) return NextResponse.json({ paid: true, brandName, poNumber });

        const stripe  = new Stripe(process.env.STOREFRONT_STRIPE_SECRET);
        // stripeAccount is a request OPTION → must be the 3rd arg. As the 2nd (params) arg this
        // SDK rejects it ("unknown parameter: stripeAccount"), so verify threw and paid invoices
        // were never marked paid (payment taken, order left custom_pending).
        const session = await stripe.checkout.sessions.retrieve(sessionId, {}, { stripeAccount: acctId });

        if (String(session?.metadata?.orderId) !== String(order._id))
            return NextResponse.json({ error: "Session mismatch" }, { status: 400 });
        if (session.payment_status !== "paid")
            return NextResponse.json({ paid: false, brandName, poNumber });

        await completeInvoiceOrder(order);
        return NextResponse.json({ paid: true, brandName, poNumber });
    } catch (err) {
        console.error("[pay verify]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
