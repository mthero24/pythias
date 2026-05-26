import { NextResponse } from "next/server";
import { ServiceInvoicePremier, ServicePlanPremier } from "@pythias/mongo";

export async function GET() {
    const invoices = await ServiceInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean();
    return NextResponse.json({ invoices });
}

export async function PUT(req) {
    const { invoiceId, status } = await req.json();
    if (!["open", "paid"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const update = { status, updatedAt: new Date() };
    if (status === "paid") update.paidAt = new Date();
    else update.paidAt = null;
    const invoice = await ServiceInvoicePremier.findByIdAndUpdate(invoiceId, update, { new: true });
    return NextResponse.json({ invoice });
}
