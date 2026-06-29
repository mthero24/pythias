import { NextResponse } from "next/server";
import { Quote } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";

// `total` is the pre-discount figure (amount due = total − discountAmount), matching the order
// convention so a quote converts to an Order 1:1.
export function quoteTotals(lines, { discountAmount = 0, shippingCost = 0, taxRate = 0 } = {}) {
    const subtotal = (lines || []).reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 1) + (Number(l.setupFee) || 0), 0);
    const tax   = (subtotal - discountAmount) * (taxRate || 0);
    const total = subtotal + (shippingCost || 0) + tax;
    return { subtotal, tax, total };
}

const normalizeLine = (l) => ({
    sku: l.sku, title: l.title, blank: l.blank || null, styleCode: l.styleCode || "",
    color: l.color || null, colorName: l.colorName || "", size: l.size || null, sizeName: l.sizeName || "",
    design: l.design || undefined, personalization: l.personalization || undefined,
    printType: l.printType || "", image: l.image || "",
    quantity: Math.max(1, parseInt(l.quantity) || 1), unitPrice: Number(l.unitPrice) || 0,
    setupFee: Number(l.setupFee) || 0, byob: !!l.byob, notes: l.notes || "",
});

// GET /api/quotes?status=&q=&skip= — list quotes (premier is single-org, no orgId filter)
export async function GET(request) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q      = searchParams.get("q") || "";
    const skip   = parseInt(searchParams.get("skip") || "0");
    const limit  = 25;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (q) filter.$or = [
        { quoteId:          { $regex: q, $options: "i" } },
        { "customer.name":  { $regex: q, $options: "i" } },
        { "customer.email": { $regex: q, $options: "i" } },
    ];

    const [quotes, total] = await Promise.all([
        Quote.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
        Quote.countDocuments(filter),
    ]);
    return NextResponse.json({ quotes, total });
}

// POST /api/quotes — create a quote (the shop builds one for a customer)
export async function POST(request) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data    = await request.json();
    const lines   = (data.lines || []).map(normalizeLine);
    const { total } = quoteTotals(lines, data);

    const quote = await Quote.create({
        quoteId: `QUOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        token:   crypto.randomBytes(16).toString("hex"),
        status:  data.status || "draft",
        customer: data.customer || {},
        lines,
        discountAmount: Number(data.discountAmount) || 0,
        discountName:   data.discountName,
        shippingCost:   Number(data.shippingCost) || 0,
        taxRate:        Number(data.taxRate) || 0,
        total,
        message:        data.message,
        internalNotes:  data.internalNotes,
        shippingAddress: data.shippingAddress,
        inStorePickup:  !!data.inStorePickup,
        expiresAt:      data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
    return NextResponse.json({ quote });
}
