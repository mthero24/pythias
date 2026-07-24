import { NextResponse } from "next/server";
import { Quote, Organization } from "@pythias/mongo";
import { convertQuoteToOrder } from "@/functions/quoteOrder";
import Stripe from "stripe";

const orgQuery = () => ({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" });

export async function GET(request, { params }) {
    const quote = await Quote.findOne({ token: params.token }).lean();
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const org = await Organization.findOne(orgQuery()).select("name").lean();
    return NextResponse.json({
        brandName: org?.name || "Premier Printing",
        quote: {
            quoteId: quote.quoteId, status: quote.status, message: quote.message,
            customer: quote.customer, lines: quote.lines,
            discountAmount: quote.discountAmount, discountName: quote.discountName,
            shippingCost: quote.shippingCost, taxRate: quote.taxRate, total: quote.total,
            expiresAt: quote.expiresAt,
        },
    });
}

export async function POST(request, { params }) {
    try {
        const { action, sessionId } = await request.json();
        const quote = await Quote.findOne({ token: params.token });
        if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const org       = await Organization.findOne(orgQuery()).select("name storefrontConnect").lean();
        const brandName = org?.name || "Premier Printing";
        const acctId    = org?.storefrontConnect?.accountId;
        if (!acctId || org.storefrontConnect.status !== "active")
            return NextResponse.json({ error: "This business hasn't finished setting up payments yet." }, { status: 400 });

        const stripe      = new Stripe(process.env.STOREFRONT_STRIPE_SECRET);
        const due         = Math.max(0, (quote.total || 0) - (quote.discountAmount || 0));
        const amountCents = Math.round(due * 100);

        if (action === "checkout") {
            if (quote.status === "converted") return NextResponse.json({ error: "This quote is already paid." }, { status: 400 });
            if (amountCents < 50) return NextResponse.json({ error: "Quote total is too low." }, { status: 400 });
            const base = (process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                line_items: [{ price_data: { currency: "usd", product_data: { name: `Quote ${quote.quoteId}` }, unit_amount: amountCents }, quantity: 1 }],
                payment_intent_data: { application_fee_amount: Math.round(amountCents * 0.02) },
                customer_email: quote.customer?.email || undefined,
                success_url: `${base}/quote/${quote.token}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url:  `${base}/quote/${quote.token}`,
                metadata: { quoteId: String(quote._id), token: quote.token },
            }, { stripeAccount: acctId });
            quote.paymentSessionId = session.id;
            quote.payUrl = session.url;
            await quote.save();
            return NextResponse.json({ url: session.url });
        }

        if (action === "verify") {
            if (quote.status === "converted") return NextResponse.json({ paid: true, brandName, poNumber: quote.quoteId });
            // stripeAccount is a request OPTION → must be the 3rd arg. Passing it as the 2nd
            // (params) arg makes Stripe reject it ("unknown parameter: stripeAccount"), which
            // threw on every verify — so no quote ever converted to an order despite being paid.
            const session = await stripe.checkout.sessions.retrieve(sessionId, {}, { stripeAccount: acctId });
            if (String(session?.metadata?.token) !== String(quote.token))
                return NextResponse.json({ error: "Session mismatch" }, { status: 400 });
            if (session.payment_status !== "paid")
                return NextResponse.json({ paid: false, brandName });

            const order = await convertQuoteToOrder(quote);
            quote.status = "converted";
            quote.approvedAt = new Date();
            quote.orderId = order._id;
            await quote.save();
            return NextResponse.json({ paid: true, brandName, poNumber: order.poNumber });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("[quote pay]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
