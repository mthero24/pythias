export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PlatformOrder, PlatformItem } from "@pythias/mongo";
import { getAuthedCustomer, trackingUrl } from "@/lib/account";

// GET /api/account/orders/[id] — one of the customer's orders, with items + tracking.
export async function GET(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const order = await PlatformOrder.findOne({ _id: id, orgId: auth.orgId, customerEmail: auth.customer.email })
        .select("poNumber date status paid shippingInfo shippingCost taxRate shippingAddress")
        .lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const items = await PlatformItem.find({ order: order._id, orgId: auth.orgId })
        .select("styleCode colorName sizeName price").lean();

    // Group identical lines and total them up.
    const lines = [];
    const map = new Map();
    for (const it of items) {
        const key = `${it.styleCode}|${it.colorName}|${it.sizeName}|${it.price}`;
        if (!map.has(key)) { const l = { styleCode: it.styleCode, colorName: it.colorName, sizeName: it.sizeName, price: it.price || 0, qty: 0 }; map.set(key, l); lines.push(l); }
        map.get(key).qty += 1;
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = order.shippingCost || 0;
    const tax = subtotal * (order.taxRate || 0);

    const tracking = (order.shippingInfo?.labels ?? [])
        .filter((l) => l.trackingNumber)
        .map((l) => ({ trackingNumber: l.trackingNumber, carrier: l.provider ?? null, url: trackingUrl(l.provider, l.trackingNumber) }));

    return NextResponse.json({
        error: false,
        order: {
            id: String(order._id),
            poNumber: order.poNumber ?? null,
            date: order.date ?? order.createdAt ?? null,
            status: order.status ?? "pending",
            paid: !!order.paid,
            shippingAddress: order.shippingAddress ?? null,
            lines,
            totals: { subtotal, shipping, tax, total: subtotal + shipping + tax },
            tracking,
        },
    });
}
