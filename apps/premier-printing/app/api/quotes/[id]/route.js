import { NextResponse } from "next/server";
import { Quote } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { quoteTotals } from "../route";

const normalizeLine = (l) => ({
    sku: l.sku, title: l.title, blank: l.blank || null, styleCode: l.styleCode || "",
    color: l.color || null, colorName: l.colorName || "", size: l.size || null, sizeName: l.sizeName || "",
    design: l.design || undefined, personalization: l.personalization || undefined,
    printType: l.printType || "", image: l.image || "",
    quantity: Math.max(1, parseInt(l.quantity) || 1), unitPrice: Number(l.unitPrice) || 0,
    setupFee: Number(l.setupFee) || 0, byob: !!l.byob, notes: l.notes || "",
});

export async function GET(request, { params }) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const quote = await Quote.findOne({ _id: params.id }).lean();
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ quote });
}

// PATCH /api/quotes/[id] — update lines/pricing/customer/status; recompute the total.
export async function PATCH(request, { params }) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data  = await request.json();
    const quote = await Quote.findOne({ _id: params.id });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.lines           !== undefined) quote.lines          = data.lines.map(normalizeLine);
    if (data.customer        !== undefined) quote.customer       = data.customer;
    if (data.discountAmount  !== undefined) quote.discountAmount = Number(data.discountAmount) || 0;
    if (data.discountName    !== undefined) quote.discountName   = data.discountName;
    if (data.shippingCost    !== undefined) quote.shippingCost   = Number(data.shippingCost) || 0;
    if (data.taxRate         !== undefined) quote.taxRate        = Number(data.taxRate) || 0;
    if (data.message         !== undefined) quote.message        = data.message;
    if (data.internalNotes   !== undefined) quote.internalNotes  = data.internalNotes;
    if (data.shippingAddress !== undefined) quote.shippingAddress = data.shippingAddress;
    if (data.inStorePickup   !== undefined) quote.inStorePickup  = !!data.inStorePickup;
    if (data.status          !== undefined) quote.status         = data.status;
    if (data.expiresAt       !== undefined) quote.expiresAt      = data.expiresAt ? new Date(data.expiresAt) : null;

    quote.total = quoteTotals(quote.lines, quote).total;
    await quote.save();
    return NextResponse.json({ quote });
}

export async function DELETE(request, { params }) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const res = await Quote.deleteOne({ _id: params.id });
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
