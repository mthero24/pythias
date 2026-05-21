import { NextResponse } from "next/server";
import { KlingInvoice, KlingVideo } from "@pythias/mongo";

export async function GET(req) {
    const month = req.nextUrl.searchParams.get("month");
    const year = req.nextUrl.searchParams.get("year");

    // Detail view: return individual videos for a specific month/year
    if (month && year) {
        const videos = await KlingVideo.find({ month: parseInt(month), year: parseInt(year) })
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json({ error: false, videos });
    }

    // List view: return all invoices sorted newest first
    const invoices = await KlingInvoice.find({}).sort({ year: -1, month: -1 }).lean();
    return NextResponse.json({ error: false, invoices });
}

export async function PUT(req) {
    const { invoiceId, status } = await req.json();
    if (!["open", "paid"].includes(status)) {
        return NextResponse.json({ error: true, msg: "Invalid status" }, { status: 400 });
    }
    const update = { status, updatedAt: new Date() };
    if (status === "paid") update.paidAt = new Date();
    else update.paidAt = null;
    const invoice = await KlingInvoice.findByIdAndUpdate(invoiceId, update, { new: true });
    return NextResponse.json({ error: false, invoice });
}
