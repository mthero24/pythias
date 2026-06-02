import { NextResponse } from "next/server";
import { ServiceInvoicePremier, ServiceInvoicePo, ServicePlanPremier, ServicePlanPo } from "@pythias/mongo";

const INVOICE_MODEL = { "premier-printing": ServiceInvoicePremier, po: ServiceInvoicePo };
const PLAN_MODEL    = { "premier-printing": ServicePlanPremier,   po: ServicePlanPo   };

export async function GET() {
    const [premierInvoices, poInvoices] = await Promise.all([
        ServiceInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean(),
        ServiceInvoicePo.find({}).sort({ year: -1, month: -1 }).lean(),
    ]);
    const invoices = [
        ...premierInvoices.map(i => ({ ...i, _client: "premier-printing" })),
        ...poInvoices.map(i => ({ ...i, _client: "po" })),
    ].sort((a, b) => b.year - a.year || b.month - a.month);
    return NextResponse.json({ invoices });
}

export async function POST(req) {
    const { month, year, client } = await req.json();
    const IM = INVOICE_MODEL[client];
    const PM = PLAN_MODEL[client];
    if (!month || !year || !IM) return NextResponse.json({ error: "month, year, and valid client required" }, { status: 400 });

    const existing = await IM.findOne({ month, year });
    if (existing) return NextResponse.json({ error: "Invoice already exists for this client and period" }, { status: 409 });

    const plans = await PM.find({ active: true }).lean();
    if (plans.length === 0) return NextResponse.json({ error: "No active service plans for this client" }, { status: 400 });

    const lines = plans.map(p => ({ appName: p.appName, description: p.description, price: p.monthlyPrice }));
    const totalAmount = lines.reduce((s, l) => s + l.price, 0);

    const invoice = await IM.create({ month, year, lines, totalAmount });
    return NextResponse.json({ invoice: { ...invoice.toObject(), _client: client } });
}

export async function PUT(req) {
    const { invoiceId, client, status, paymentMethod, paymentNote } = await req.json();
    const IM = INVOICE_MODEL[client];
    if (!["open", "paid"].includes(status) || !IM) {
        return NextResponse.json({ error: "Invalid status or client" }, { status: 400 });
    }
    const update = { status, updatedAt: new Date() };
    if (status === "paid") {
        update.paidAt = new Date();
        if (paymentMethod) update.paymentMethod = paymentMethod;
        if (paymentNote !== undefined) update.paymentNote = paymentNote;
    } else {
        update.paidAt = null;
        update.paymentMethod = null;
        update.paymentNote = "";
    }
    const invoice = await IM.findByIdAndUpdate(invoiceId, update, { new: true });
    return NextResponse.json({ invoice });
}
