export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { quoteCart } from "@/lib/checkout";
import { storefrontStripe, computeTax } from "@/lib/stripe";

// POST /api/checkout/quote — totals (subtotal + shipping + tax) for items at an address, WITHOUT
// creating a PaymentIntent. Used by the Express Checkout Element's onShippingAddressChange so the
// wallet sheet shows correct shipping/tax as the buyer picks an address.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const auth = await getAuthedCustomer(req).catch(() => null);
    const q = await quoteCart({ orgId: ctx.orgId, site: ctx.site, customer: auth?.customer ?? null, items: body?.items ?? [], redeemCents: body?.redeemCents, promoCode: body?.promoCode, giftCardCode: body?.giftCardCode });
    if (!q.lines.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const stripe = storefrontStripe();
    const currency = (ctx.site?.rewards?.currency || "usd").toLowerCase();
    let taxCents = 0;
    if (stripe && body?.shippingAddress?.country) {
        // Wallet address-change only exposes city/state/zip/country (no line1); supply a placeholder line1
        // so Stripe Tax (which keys US sales tax off the ZIP/state) computes the same figure as at confirm.
        const addr = { ...body.shippingAddress, address1: body.shippingAddress.address1 || "1 Main St" };
        try { ({ taxCents } = await computeTax(stripe, { currency, lines: q.lines, shippingCents: q.shippingCents, address: addr })); } catch { taxCents = 0; }
    }
    const totalCents = Math.max(0, q.subtotalCents + q.shippingCents + taxCents);
    return NextResponse.json({ error: false, subtotalCents: q.subtotalCents, shippingCents: q.shippingCents, taxCents, totalCents, currency });
}
