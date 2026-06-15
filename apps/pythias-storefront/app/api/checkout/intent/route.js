export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer, StorefrontCheckoutSession } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { getAuthedCustomer } from "@/lib/account";
import { quoteCart, placeOrder } from "@/lib/checkout";
import { storefrontStripe, STOREFRONT_PUBLISHABLE_KEY, computeTax } from "@/lib/stripe";

// POST /api/checkout/intent — open a Stripe PaymentIntent for the cart (Payment Element on
// the client shows cards/Link/Apple-Google-Amazon Pay/PayPal/Affirm). Body: { items,
// shippingAddress, email?, redeemCents? }. Returns clientSecret for the Payment Element.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const stripe = storefrontStripe();
    if (!stripe) return NextResponse.json({ error: "Payments are not configured for this store yet" }, { status: 503 });

    const body = await req.json().catch(() => null);
    const auth = await getAuthedCustomer(req).catch(() => null);
    const customer = auth?.customer ?? null;
    const email = body?.email || customer?.email;

    const q = await quoteCart({ orgId: ctx.orgId, site: ctx.site, customer, items: body?.items ?? [], redeemCents: body?.redeemCents, promoCode: body?.promoCode, giftCardCode: body?.giftCardCode });
    if (!q.lines.length) return NextResponse.json({ error: "Cart is empty or unavailable" }, { status: 400 });

    // Sales tax (Stripe Tax) on items + shipping, at the buyer's address. Rewards + promo
    // discounts reduce the total after tax; the gift card then applies last (like a payment).
    const currency = (ctx.site?.rewards?.currency || "usd").toLowerCase();
    const { taxCents, calcId } = await computeTax(stripe, { currency, lines: q.lines, shippingCents: q.shippingCents, address: body?.shippingAddress });
    const preGift = Math.max(0, q.subtotalCents + q.shippingCents + taxCents - q.rewardsApplied - (q.discountCents || 0));
    const giftCardApplied = q.giftCardCode ? Math.min(q.giftCardBalance, preGift) : 0;
    const totalCents = Math.max(0, preGift - giftCardApplied);

    // Stripe Customer (saved cards / Link) for logged-in buyers.
    let stripeCustomerId = customer?.stripeCustomerId;
    if (customer && !stripeCustomerId) {
        const sc = await stripe.customers.create({ email: customer.email, metadata: { orgId: String(ctx.orgId), customerId: String(customer._id) } });
        stripeCustomerId = sc.id;
        await StorefrontCustomer.updateOne({ _id: customer._id }, { $set: { stripeCustomerId } });
    }

    const session = await StorefrontCheckoutSession.create({
        orgId: ctx.orgId, customerId: customer?._id, items: body?.items ?? [],
        shippingAddress: body?.shippingAddress, email, redeemCents: q.rewardsApplied, promoCode: q.discountCode, giftCardCode: q.giftCardCode,
        taxCents, taxCalcId: calcId, amountCents: totalCents,
    });

    const totals = { subtotalCents: q.subtotalCents, shippingCents: q.shippingCents, taxCents, rewardsApplied: q.rewardsApplied, discountCents: q.discountCents || 0, discountCode: q.discountCode, discountTitle: q.discountTitle, freeShipping: q.freeShipping, giftCardApplied, giftCardCode: q.giftCardCode, totalCents };

    // Fully covered (rewards/discount/gift card) — no payment needed; place immediately.
    if (totalCents <= 0) {
        const result = await placeOrder({ orgId: ctx.orgId, site: ctx.site, customer, items: body?.items ?? [], shippingAddress: body?.shippingAddress, email, redeemCents: q.rewardsApplied, promoCode: q.discountCode, giftCardCode: q.giftCardCode, taxCents, paymentRef: `free_${session._id}` });
        await StorefrontCheckoutSession.updateOne({ _id: session._id }, { $set: { status: "completed", orderId: result.orderId } });
        return NextResponse.json({ error: false, free: true, orderId: result.orderId, totals });
    }

    const pi = await stripe.paymentIntents.create({
        amount: totalCents,
        currency,
        ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
        ...(email ? { receipt_email: email } : {}),
        automatic_payment_methods: { enabled: true },
        metadata: { sessionId: String(session._id), orgId: String(ctx.orgId), customerId: customer ? String(customer._id) : "" },
    });
    await StorefrontCheckoutSession.updateOne({ _id: session._id }, { $set: { paymentIntentId: pi.id } });

    return NextResponse.json({ error: false, clientSecret: pi.client_secret, publishableKey: STOREFRONT_PUBLISHABLE_KEY, amountCents: totalCents, totals });
}
