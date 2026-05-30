import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ServiceInvoicePremier, ServicePlanPremier } from "@pythias/mongo";

function canAccess(token) {
    if (!token) return false;
    const perms = token.permissions || {};
    perms.account = true; perms.inventory = true; perms.designsView = true;
    return (token.role === "admin" || token.role === "production") && perms.charts;
}

export async function GET(req) {
    const token = await getToken({ req });
    if (!canAccess(token)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const invoices = await ServiceInvoicePremier.find({}).sort({ year: -1, month: -1 }).lean();
    return NextResponse.json({ invoices });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!canAccess(token)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
