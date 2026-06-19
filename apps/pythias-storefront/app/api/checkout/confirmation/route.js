export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformOrder, PlatformItem } from "@pythias/mongo";

// GET /api/checkout/confirmation?pi=<paymentIntentId> — minimal, non-PII order summary for the
// thank-you page. Keyed by the Stripe payment intent (which Stripe puts in the buyer's return URL).
// Returns only what the buyer should re-see: order #, item names, gift add-ons, totals — no address/email.
// The order is created asynchronously by the webhook, so the client polls until it appears.
export async function GET(req) {
    const site = await resolveSite(req.headers.get("host"));
    if (!site) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const pi = new URL(req.url).searchParams.get("pi");
    if (!pi) return NextResponse.json({ error: false, order: null });

    const order = await PlatformOrder.findOne({ paymentRef: pi, orgId: site.orgId, source: "storefront" })
        .select("poNumber date status shippingCost taxRate giftAddOns shippingMethod").lean();
    if (!order) return NextResponse.json({ error: false, order: null });   // not placed yet — client retries

    const allItems = await PlatformItem.find({ order: order._id, orgId: site.orgId })
        .select("styleCode colorName sizeName price name addOn").lean();
    const items = allItems.filter((i) => !i.addOn);

    const lines = [];
    const map = new Map();
    for (const it of items) {
        const key = `${it.styleCode}|${it.colorName}|${it.sizeName}|${it.price}`;
        if (!map.has(key)) {
            const l = { name: it.name || [it.styleCode, it.colorName, it.sizeName].filter(Boolean).join(" · ") || "Item", qty: 0, price: it.price || 0 };
            map.set(key, l); lines.push(l);
        }
        map.get(key).qty += 1;
    }
    const giftAddOns = (order.giftAddOns || []).map((g) => ({ label: g.label, priceCents: g.priceCents || 0, message: g.message || "" }));
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const addOns = giftAddOns.reduce((s, g) => s + (g.priceCents || 0), 0) / 100;
    const shipping = order.shippingCost || 0;
    const tax = subtotal * (order.taxRate || 0);

    return NextResponse.json({
        error: false,
        order: {
            poNumber: order.poNumber ?? null,
            lines, giftAddOns,
            shippingMethod: order.shippingMethod ?? null,
            totals: { subtotal, addOns, shipping, tax, total: subtotal + addOns + shipping + tax },
        },
    });
}
