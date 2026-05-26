import { NextResponse } from "next/server";
import { KlingInvoicePremier, KlingInvoicePo, KlingVideo } from "@pythias/mongo";

const MODEL = { "premier-printing": KlingInvoicePremier, po: KlingInvoicePo };

export async function GET(req) {
    const month = req.nextUrl.searchParams.get("month");
    const year = req.nextUrl.searchParams.get("year");

    if (month && year) {
        const client = req.nextUrl.searchParams.get("client");
        const filter = { month: parseInt(month), year: parseInt(year) };
        if (client) filter.client = client;
        const videos = await KlingVideo.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ error: false, videos });
    }

    const [premierInvoices, poInvoices] = await Promise.all([
        KlingInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean(),
        KlingInvoicePo.find({}).sort({ year: -1, month: -1 }).lean(),
    ]);
    const invoices = [
        ...premierInvoices.map(i => ({ ...i, _client: "premier-printing" })),
        ...poInvoices.map(i => ({ ...i, _client: "po" })),
    ].sort((a, b) => b.year - a.year || b.month - a.month);
    return NextResponse.json({ error: false, invoices });
}

export async function PUT(req) {
    const { invoiceId, client, status } = await req.json();
    const M = MODEL[client];
    if (!["open", "paid"].includes(status) || !M) {
        return NextResponse.json({ error: true, msg: "Invalid status or client" }, { status: 400 });
    }
    const update = { status, updatedAt: new Date() };
    if (status === "paid") update.paidAt = new Date();
    else update.paidAt = null;
    const invoice = await M.findByIdAndUpdate(invoiceId, update, { new: true });
    return NextResponse.json({ error: false, invoice });
}
