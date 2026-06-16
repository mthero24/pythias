export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { placeOrder } from "@/lib/checkout";

// POST /api/checkout/place — create the order from a cart and settle rewards.
// Body: { items, shippingAddress, email?, redeemCents? }
//
// ⚠️ Pre-launch: this is the order-creation core. Before go-live, placement must be GATED
// by confirmed payment (the Stripe webhook will call placeOrder() after payment succeeds);
// this direct endpoint exists for building/testing the pipeline.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const auth = await getAuthedCustomer(req).catch(() => null);
    const body = await req.json().catch(() => null);
    if (!body?.items?.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    try {
        const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || undefined;
        const result = await placeOrder({
            orgId: ctx.orgId,
            site: ctx.site,
            customer: auth?.customer ?? null,
            items: body.items,
            shippingAddress: body.shippingAddress,
            email: body.email,
            redeemCents: body.redeemCents,
            ip,
        });
        return NextResponse.json({ error: false, ...result }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
