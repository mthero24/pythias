import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Quote, Order } from "@pythias/mongo";
import { convertQuoteToOrder } from "@/functions/quoteOrder";
import { completeInvoiceOrder } from "@/functions/completeInvoiceOrder";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STOREFRONT_STRIPE_SECRET);

// Stripe Connect webhook backstop for quote payments. The customer page also
// converts a paid quote (client-side "verify"), but if they never return to the
// page (closed tab, redirect failed) the order would never be created. This
// creates it server-side, independent of the browser.
//
// SETUP: in the storefront/marketplace Stripe account, add a webhook endpoint
// pointing here, of type "Connect" (listen to events on connected accounts),
// subscribed to `checkout.session.completed`, and set the signing secret as
// STOREFRONT_STRIPE_WEBHOOK_SECRET. Conversion is idempotent (guarded by
// quote.status === "converted"), so it's safe alongside the client verify.
export async function POST(req) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const secret = process.env.STOREFRONT_STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        if (secret) {
            event = stripe.webhooks.constructEvent(body, sig, secret);
        } else {
            console.warn("[quote webhook] STOREFRONT_STRIPE_WEBHOOK_SECRET not set — processing UNVERIFIED");
            event = JSON.parse(body);
        }
    } catch (err) {
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const md = session?.metadata || {};
            if (session.payment_status === "paid") {
                if (md.token) {
                    // Quote checkout → create the production order.
                    const quote = await Quote.findOne({ token: md.token });
                    if (quote && quote.status !== "converted") {
                        const order = await convertQuoteToOrder(quote);
                        quote.status = "converted";
                        quote.approvedAt = new Date();
                        quote.orderId = order._id;
                        await quote.save();
                        console.log(`[quote webhook] created order ${order.poNumber} for quote ${quote.quoteId}`);
                    }
                } else if (md.invoiceToken || md.orderId) {
                    // Custom-order invoice checkout → mark the existing order paid.
                    const order = md.invoiceToken
                        ? await Order.findOne({ invoiceToken: md.invoiceToken })
                        : await Order.findById(md.orderId);
                    if (order && !order.paid) {
                        await completeInvoiceOrder(order);
                        console.log(`[quote webhook] marked invoice order ${order.poNumber} paid`);
                    }
                }
            }
        }
        return NextResponse.json({ received: true });
    } catch (e) {
        // Return 500 so Stripe retries (with backoff) — the conversion is idempotent,
        // so a retry after a transient failure won't double-create the order.
        console.error("[quote webhook] handler error:", e?.message, e);
        return NextResponse.json({ error: "handler error" }, { status: 500 });
    }
}
