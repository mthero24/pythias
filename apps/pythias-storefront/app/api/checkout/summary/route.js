export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { quoteCart } from "@/lib/checkout";
import { storefrontStripe, computeTax } from "@/lib/stripe";

// POST /api/checkout/summary — price a cart + show totals (incl. reward redemption preview).
// Body: { items:[{productId,sku,qty}], redeemCents?, shippingAddress? }. Auth optional (rewards need login).
// When a shippingAddress is supplied (single-page checkout), computes real address-based Stripe Tax so
// the live total matches what's charged at confirm.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const auth = await getAuthedCustomer(req).catch(() => null);

    const subEnabled = !!(ctx.site?.subscriptions?.enabled && body?.subscribe && auth);
    const q = await quoteCart({ orgId: ctx.orgId, site: ctx.site, customer: auth?.customer ?? null, items: body?.items ?? [], redeemCents: body?.redeemCents, promoCode: body?.promoCode, giftCardCode: body?.giftCardCode, subscribe: subEnabled, addOns: body?.addOns || {}, shippingCountry: body?.shippingAddress?.country, shippingMethod: body?.shippingMethod });

    // Address-based tax (single-page checkout sends the shipping address as it's filled in).
    let taxCents = q.taxCents, totalCents = q.totalCents;
    const stripe = storefrontStripe();
    if (stripe && body?.shippingAddress?.country && q.lines.length) {
        const currency = (ctx.site?.rewards?.currency || "usd").toLowerCase();
        const addr = { ...body.shippingAddress, address1: body.shippingAddress.address1 || "1 Main St" };
        try {
            const t = await computeTax(stripe, { currency, lines: q.lines, shippingCents: q.shippingCents, address: addr });
            taxCents = t.taxCents;
            totalCents = Math.max(0, q.totalCents - (q.taxCents || 0) + taxCents);   // swap estimated tax for the real figure
        } catch { /* keep quoteCart's estimate */ }
    }

    return NextResponse.json({
        error: false,
        lines: q.lines,
        errors: q.errors,
        shipsTo: q.shipsTo, shippingOptions: q.shippingOptions, shippingMethod: q.shippingMethod,
        addOnLines: q.addOnLines, addOnsCents: q.addOnsCents,
        totals: { subtotalCents: q.subtotalCents, shippingCents: q.shippingCents, taxCents, rewardsApplied: q.rewardsApplied, discountCents: q.discountCents || 0, discountCode: q.discountCode, discountTitle: q.discountTitle, freeShipping: q.freeShipping, giftCardApplied: q.giftCardApplied || 0, giftCardCode: q.giftCardCode, totalCents },
        rewards: { balance: auth?.customer?.rewardsBalance || 0, applied: q.rewardsApplied, eligible: !!auth },
        discount: { code: q.discountCode, title: q.discountTitle, cents: q.discountCents || 0, freeShipping: q.freeShipping, error: q.discountError },
        giftCard: { code: q.giftCardCode, applied: q.giftCardApplied || 0, balance: q.giftCardBalance || 0, error: body?.giftCardCode && !q.giftCardCode ? "invalid" : null },
        subscriptions: ctx.site?.subscriptions?.enabled ? { enabled: true, discountPercent: ctx.site.subscriptions.discountPercent || 0, intervals: ctx.site.subscriptions.intervals || [] } : { enabled: false },
    });
}
