import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ServiceInvoicePo } from "@pythias/mongo";

function isAdmin(token) {
    return token?.role === "admin" || token?.permissions?.admin;
}

export async function GET(req) {
    const token = await getToken({ req });
    if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const invoices = await ServiceInvoicePo.find({}).sort({ year: -1, month: -1 }).lean();
    return NextResponse.json({ invoices });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { invoiceId, status } = await req.json();
    if (!["open", "paid"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const update = { status, updatedAt: new Date() };
    if (status === "paid") update.paidAt = new Date();
    else update.paidAt = null;
    const invoice = await ServiceInvoicePo.findByIdAndUpdate(invoiceId, update, { new: true });
    return NextResponse.json({ invoice });
}
