export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { quoteCart } from "@/lib/checkout";

// POST /api/checkout/summary — price a cart + show totals (incl. reward redemption preview).
// Body: { items:[{productId,sku,qty}], redeemCents? }. Auth optional (rewards need login).
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const auth = await getAuthedCustomer(req).catch(() => null);

    const q = await quoteCart({ orgId: ctx.orgId, site: ctx.site, customer: auth?.customer ?? null, items: body?.items ?? [], redeemCents: body?.redeemCents, promoCode: body?.promoCode, giftCardCode: body?.giftCardCode });

    return NextResponse.json({
        error: false,
        lines: q.lines,
        errors: q.errors,
        totals: { subtotalCents: q.subtotalCents, shippingCents: q.shippingCents, taxCents: q.taxCents, rewardsApplied: q.rewardsApplied, discountCents: q.discountCents || 0, discountCode: q.discountCode, discountTitle: q.discountTitle, freeShipping: q.freeShipping, giftCardApplied: q.giftCardApplied || 0, giftCardCode: q.giftCardCode, totalCents: q.totalCents },
        rewards: { balance: auth?.customer?.rewardsBalance || 0, applied: q.rewardsApplied, eligible: !!auth },
        discount: { code: q.discountCode, title: q.discountTitle, cents: q.discountCents || 0, freeShipping: q.freeShipping, error: q.discountError },
        giftCard: { code: q.giftCardCode, applied: q.giftCardApplied || 0, balance: q.giftCardBalance || 0, error: body?.giftCardCode && !q.giftCardCode ? "invalid" : null },
    });
}
