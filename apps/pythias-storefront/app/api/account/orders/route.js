export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { getAuthedCustomer, trackingUrl } from "@/lib/account";

function firstTracking(order) {
    const lbl = (order.shippingInfo?.labels ?? []).find((l) => l.trackingNumber);
    if (!lbl) return null;
    return { trackingNumber: lbl.trackingNumber, carrier: lbl.provider ?? null, url: trackingUrl(lbl.provider, lbl.trackingNumber) };
}

// GET /api/account/orders — the signed-in customer's order history (this storefront only).
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Orders are matched by the customer's email within this org. (Checkout will also stamp
    // storefrontCustomerId for a hard link.)
    const orders = await PlatformOrder.find({ orgId: auth.orgId, customerEmail: auth.customer.email })
        .select("poNumber date status paid shippingInfo giftAddOns")
        .sort({ date: -1 })
        .limit(100)
        .lean();

    return NextResponse.json({
        error: false,
        orders: orders.map((o) => ({
            id: String(o._id),
            poNumber: o.poNumber ?? null,
            date: o.date ?? o.createdAt ?? null,
            status: o.status ?? "pending",
            paid: !!o.paid,
            hasGift: (o.giftAddOns?.length || 0) > 0,
            tracking: firstTracking(o),
        })),
    });
}
