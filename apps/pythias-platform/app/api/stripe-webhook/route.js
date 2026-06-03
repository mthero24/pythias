import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ServiceInvoicePremier, BillingCustomer } from "@pythias/mongo";

export async function POST(req) {
    const stripe = new Stripe(process.env.stripeSecret);
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = webhookSecret
            ? stripe.webhooks.constructEvent(body, sig, webhookSecret)
            : JSON.parse(body);
    } catch (err) {
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId;
        if (invoiceId && session.payment_status === "paid") {
            await ServiceInvoicePremier.findByIdAndUpdate(invoiceId, { status: "paid", paidAt: new Date() });
        }
        if (session.customer && session.payment_intent) {
            try {
                const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
                if (pi.payment_method) {
                    await BillingCustomer.findOneAndUpdate(
                        { client: "premier-printing" },
                        { stripeCustomerId: session.customer, stripePaymentMethodId: pi.payment_method, updatedAt: new Date() },
                        { upsert: true }
                    );
                }
            } catch (e) {
                console.error("[webhook premier] failed to save billing customer:", e.message);
            }
        }
    }

    if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
            await ServiceInvoicePremier.findByIdAndUpdate(invoiceId, { status: "paid", paidAt: new Date() });
        }
    }

    return NextResponse.json({ received: true });
}
