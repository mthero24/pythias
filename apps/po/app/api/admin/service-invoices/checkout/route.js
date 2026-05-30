import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import Stripe from "stripe";
import { ServiceInvoicePo } from "@pythias/mongo";

const stripe = new Stripe(process.env.stripeSecret);

export async function POST(req) {
    const token = await getToken({ req });
    if (token?.role !== "admin" && !token?.permissions?.admin)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { invoiceId } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

    const invoice = await ServiceInvoicePo.findById(invoiceId).lean();
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

    const baseUrl = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "https://production.printoracle.com";

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card", "us_bank_account"],
        line_items: invoice.lines.map(line => ({
            price_data: {
                currency: "usd",
                product_data: { name: line.appName, description: line.description || undefined },
                unit_amount: Math.round(line.price * 100),
            },
            quantity: 1,
        })),
        payment_intent_data: {
            setup_future_usage: "off_session",
            metadata: { invoiceId: invoiceId.toString(), client: "po" },
        },
        metadata: { invoiceId: invoiceId.toString(), client: "po" },
        success_url: `${baseUrl}/admin/service-invoices/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/admin/service-invoices`,
        customer_creation: "always",
    });

    return NextResponse.json({ url: session.url });
}
