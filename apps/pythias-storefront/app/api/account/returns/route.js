export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PlatformOrder, PlatformItem, StorefrontReturn, StorefrontSite } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

const shape = (r) => ({
    id: String(r._id), rmaNumber: r.rmaNumber, orderId: String(r.orderId), poNumber: r.poNumber,
    status: r.status, resolution: r.resolution, items: r.items, refundCents: r.refundCents,
    creditCents: r.creditCents, sellerNote: r.sellerNote, createdAt: r.createdAt,
});

// GET /api/account/returns — the signed-in buyer's returns.
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const returns = await StorefrontReturn.find({ orgId: auth.orgId, customerId: auth.customer._id }).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ error: false, returns: returns.map(shape) });
}

// POST /api/account/returns — request a return/exchange. Body: { orderId, items[], resolution, note }
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId, customer } = auth;

    const b = await req.json().catch(() => null);
    if (!b?.orderId || !mongoose.Types.ObjectId.isValid(b.orderId)) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    if (!Array.isArray(b.items) || !b.items.length) return NextResponse.json({ error: "Select at least one item" }, { status: 400 });

    const order = await PlatformOrder.findOne({ _id: b.orderId, orgId, customerEmail: customer.email }).select("poNumber date").lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Once any item's production label has printed, the order is in production — buyers can no longer
    // self-serve a return/cancel online; they must contact the store (which can still refund manually).
    if (await PlatformItem.exists({ order: order._id, orgId, labelPrinted: true })) {
        return NextResponse.json({ error: "This order is already in production, so it can't be returned or cancelled online. Please contact us and we'll take care of it for you." }, { status: 409 });
    }

    const site = await StorefrontSite.findOne({ orgId }).select("returns").lean();
    if (site?.returns && site.returns.enabled === false) return NextResponse.json({ error: "Returns are not accepted for this store" }, { status: 400 });
    const windowDays = site?.returns?.windowDays ?? 30;
    const orderDate = order.date ? new Date(order.date) : null;
    if (orderDate && Date.now() - orderDate.getTime() > windowDays * 864e5) {
        return NextResponse.json({ error: `Returns must be requested within ${windowDays} days of your order.` }, { status: 400 });
    }
    if (await StorefrontReturn.exists({ orgId, orderId: order._id, status: { $in: ["requested", "approved", "received"] } })) {
        return NextResponse.json({ error: "There's already an open return for this order." }, { status: 409 });
    }

    const items = b.items.slice(0, 50).map((i) => ({
        productId: mongoose.Types.ObjectId.isValid(i.productId) ? i.productId : undefined,
        styleCode: i.styleCode, colorName: i.colorName, sizeName: i.sizeName,
        qty: Math.max(1, Number(i.qty) || 1), reason: i.reason || "other",
    }));
    const rmaNumber = `RMA${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const resolution = ["refund", "store_credit", "exchange"].includes(b.resolution) ? b.resolution : "refund";

    const ret = await StorefrontReturn.create({
        orgId, orderId: order._id, poNumber: order.poNumber, customerId: customer._id, customerEmail: customer.email,
        rmaNumber, items, resolution, note: b.note?.toString().slice(0, 1000), status: "requested",
    });
    return NextResponse.json({ error: false, return: shape(ret) }, { status: 201 });
}
