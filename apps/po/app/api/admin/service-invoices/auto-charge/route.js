import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ServiceInvoicePo, BillingCustomer } from "@pythias/mongo";

const stripe = new Stripe(process.env.stripeSecret);
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function POST(req) {
    const { month, year } = await req.json();
    if (!month || !year) return NextResponse.json({ ok: false, reason: "month and year required" }, { status: 400 });

    const invoice = await ServiceInvoicePo.findOne({ month, year });
    if (!invoice) return NextResponse.json({ ok: false, reason: "invoice not found" });
    if (invoice.status === "paid") return NextResponse.json({ ok: true, reason: "already paid" });

    const customer = await BillingCustomer.findOne({ client: "po" });
    if (!customer) return NextResponse.json({ ok: false, reason: "no payment method on file" });

    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    try {
        const pi = await stripe.paymentIntents.create({
            amount: Math.round(invoice.totalAmount * 100),
            currency: "usd",
            customer: customer.stripeCustomerId,
            payment_method: customer.stripePaymentMethodId,
            confirm: true,
            off_session: true,
            description: `PO service invoice — ${monthLabel}`,
            metadata: { invoiceId: invoice._id.toString(), client: "po" },
        });

        if (pi.status === "succeeded") {
            await ServiceInvoicePo.findByIdAndUpdate(invoice._id, { status: "paid", paidAt: new Date() });
            return NextResponse.json({ ok: true, charged: true, amount: invoice.totalAmount });
        }

        return NextResponse.json({ ok: false, reason: "payment did not succeed", status: pi.status });
    } catch (e) {
        console.error("[auto-charge po]", e.message);
        return NextResponse.json({ ok: false, reason: e.message }, { status: 500 });
    }
}
