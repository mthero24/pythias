import { NextResponse } from "next/server";
import { PlatformOrder as Order, Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";
import crypto from "crypto";

// Payable invoice email — a single "Pay Now" button to the Stripe-hosted checkout.
function payEmailHtml({ brandName, order, amountDue, payUrl }) {
    const addr = order.shippingAddress || {};
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#111827;padding:24px 32px;">
            <span style="color:#D3A73D;font-size:20px;font-weight:700;">${brandName}</span>
        </div>
        <div style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#111827;">Invoice #${order.poNumber || order.orderId}</h2>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">${addr.name ? addr.name + ", your" : "Your"} order is ready for payment.</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                <div style="color:#6b7280;font-size:13px;">Amount Due</div>
                <div style="color:#111827;font-size:32px;font-weight:700;">$${amountDue.toFixed(2)}</div>
            </div>
            <a href="${payUrl}" style="display:block;background:#D3A73D;color:#111827;text-decoration:none;font-weight:700;text-align:center;padding:14px;border-radius:8px;font-size:16px;">Pay Now</a>
            <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;text-align:center;">Secure payment powered by Stripe. This link is unique to your order.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">${brandName} · pythiastechnologies.com</p>
        </div>
    </div>`;
}

// POST /api/admin/custom-order/invoice/pay — create a payable Stripe Checkout link for a custom
// order and email it to the customer. The charge is a DIRECT charge on the seller's connected
// account, so Stripe takes its processing fee from the seller; Pythias keeps a 2% application fee.
export async function POST(request) {
    try {
        const token = await getToken({ req: request });
        const orgId = token?.orgId;
        const { orderId, email } = await request.json();
        if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

        const [order, org] = await Promise.all([
            Order.findOne({ _id: orderId, orgId, marketplace: { $in: ["custom order", "custom"] } }),
            Organization.findById(orgId).select("name storefrontConnect").lean(),
        ]);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        if (order.paid) return NextResponse.json({ error: "This order is already paid" }, { status: 400 });

        const acctId = org?.storefrontConnect?.accountId;
        if (!acctId || org.storefrontConnect.status !== "active")
            return NextResponse.json({ error: "Set up your payout account first (Settings → Payouts) so customers can pay you." }, { status: 400 });

        const key = process.env.STOREFRONT_STRIPE_SECRET;
        if (!key) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
        const stripe = new Stripe(key);

        const amountDue   = Math.max(0, (order.total || 0) - (order.discountAmount || 0));
        const amountCents = Math.round(amountDue * 100);
        if (amountCents < 50) return NextResponse.json({ error: "Order total is too low to invoice" }, { status: 400 });

        const to = email || order.customerEmail;
        if (!to) return NextResponse.json({ error: "No customer email on this order" }, { status: 400 });

        const invoiceToken = order.invoiceToken || crypto.randomBytes(16).toString("hex");
        const base      = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
        const brandName = org?.name || "Pythias";

        // Direct charge on the connected account ({ stripeAccount }); application_fee_amount → Pythias.
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{
                price_data: { currency: "usd", product_data: { name: `Order ${order.poNumber || order.orderId}` }, unit_amount: amountCents },
                quantity: 1,
            }],
            payment_intent_data: { application_fee_amount: Math.round(amountCents * 0.02) },
            customer_email: to,
            success_url: `${base}/pay/success?t=${invoiceToken}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${base}/pay/cancelled`,
            metadata: { orderId: String(order._id), orgId: String(orgId), invoiceToken },
        }, { stripeAccount: acctId });

        order.invoiceToken     = invoiceToken;
        order.paymentSessionId = session.id;
        order.payUrl           = session.url;
        await order.save();

        await sendEmail({
            to,
            subject: `Your invoice from ${brandName} — $${amountDue.toFixed(2)}`,
            html: payEmailHtml({ brandName, order, amountDue, payUrl: session.url }),
        });

        return NextResponse.json({ ok: true, url: session.url });
    } catch (err) {
        console.error("[custom-order invoice pay]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
