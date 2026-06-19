export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PlatformOrder, PlatformItem, PlatformProduct } from "@pythias/mongo";
import { getAuthedCustomer, trackingUrl, resolveLineImage } from "@/lib/account";

// GET /api/account/orders/[id] — one of the customer's orders, with items + tracking.
export async function GET(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const order = await PlatformOrder.findOne({ _id: id, orgId: auth.orgId, customerEmail: auth.customer.email })
        .select("poNumber date status paid shippingInfo shippingCost taxRate shippingAddress fulfillmentGroups giftAddOns shippingMethod")
        .lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const allItems = await PlatformItem.find({ order: order._id, orgId: auth.orgId })
        .select("styleCode colorName sizeName price design personalization product color name addOn addOnType giftMessage").lean();
    // Gift add-ons are their own items — keep them out of the product line list and surface separately.
    const items = allItems.filter((i) => !i.addOn);
    const addOnItems = allItems.filter((i) => i.addOn);

    // Resolve a representative image per item — product mockup for pre-made, placement proof/artwork
    // for custom. Batch-load the referenced products once.
    const productIds = [...new Set(items.map((i) => i.product).filter(Boolean).map(String))];
    const products = productIds.length
        ? await PlatformProduct.find({ _id: { $in: productIds }, orgId: auth.orgId }).select("image images variantsArray").lean()
        : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Group identical lines and total them up.
    const lines = [];
    const map = new Map();
    for (const it of items) {
        const key = `${it.styleCode}|${it.colorName}|${it.sizeName}|${it.price}`;
        if (!map.has(key)) {
            const l = {
                styleCode: it.styleCode, colorName: it.colorName, sizeName: it.sizeName,
                price: it.price || 0, qty: 0, name: it.name || null,
                image: resolveLineImage(it, productMap.get(String(it.product))),
            };
            map.set(key, l); lines.push(l);
        }
        map.get(key).qty += 1;
    }
    // Gift add-ons: prefer the order's recorded list (carries the gift message), fall back to the add-on items.
    const giftAddOns = (order.giftAddOns?.length
        ? order.giftAddOns.map((g) => ({ label: g.label, priceCents: g.priceCents || 0, message: g.message || "" }))
        : addOnItems.map((it) => ({ label: it.name || "Gift add-on", priceCents: Math.round((it.price || 0) * 100), message: it.giftMessage || "" })));
    const addOnsTotal = giftAddOns.reduce((s, g) => s + (g.priceCents || 0), 0) / 100;

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
            giftAddOns,
            shippingMethod: order.shippingMethod ?? null,
            totals: { subtotal, addOns: addOnsTotal, shipping, tax, total: subtotal + addOnsTotal + shipping + tax },
            tracking,
            // Only surface fulfillment grouping when the order is split across >1 fulfiller.
            fulfillment: (order.fulfillmentGroups?.length > 1)
                ? order.fulfillmentGroups.map((g) => ({ vertical: g.vertical, itemCount: g.itemCount, status: g.status }))
                : null,
        },
    });
}
