import { PlatformOrder, PlatformItem, StorefrontCustomer, StorefrontSession, screenOrder } from "@pythias/mongo";
import { validateCart } from "@/lib/cart";
import { enrollFlows } from "@/lib/flows";
import { computeRedeemable, redeemForOrder, earnForOrder } from "@/lib/rewards";
import { validateDiscount, bestAutomaticDiscount, consumeDiscount, validateGiftCard, redeemGiftCard } from "@/lib/discounts";
import { enqueueOrderConfirmation } from "@/lib/emailFlows";

// Seller-controlled shipping: free (promo), free over a threshold, else a flat rate.
export function computeShipping(site, subtotalCents) {
    const s = site?.shipping;
    if (!s) return 0;
    if (s.freeShipping) return 0;
    if (s.freeOverCents > 0 && subtotalCents >= s.freeOverCents) return 0;
    return Math.max(0, s.flatRateCents || 0);
}

// Single source of truth for cart totals — used by summary, payment intent, and placement.
// taxCents is 0 in the cart/summary and the real Stripe Tax amount at the payment step.
export async function quoteCart({ orgId, site, customer, items, redeemCents, promoCode, giftCardCode, subscribe, taxCents = 0 }) {
    const { lines, subtotalCents, wholesaleTotalCents, errors } = await validateCart(orgId, items);

    // Subscribe & save replaces other code/automatic discounts; otherwise an explicit code wins,
    // else the best AUTOMATIC (codeless) discount applies.
    let promo = { ok: false }, discountCents = 0, freeShipping = false, subscribeDiscount = false;
    if (subscribe && site?.subscriptions?.enabled) {
        discountCents = Math.round((subtotalCents * (site.subscriptions.discountPercent || 0)) / 100);
        subscribeDiscount = true;
    } else {
        promo = promoCode ? await validateDiscount(orgId, promoCode, subtotalCents) : await bestAutomaticDiscount(orgId, subtotalCents);
        discountCents = promo.ok ? promo.discountCents : 0;
        freeShipping = !!(promo.ok && promo.freeShipping);
    }

    const rewardsApplied = customer ? computeRedeemable(site, customer.rewardsBalance || 0, subtotalCents, redeemCents) : 0;
    const shippingCents = freeShipping ? 0 : computeShipping(site, subtotalCents);

    // Discounts + rewards reduce the total after tax; the gift card then applies last, like a payment.
    let totalCents = Math.max(0, subtotalCents + shippingCents + taxCents - rewardsApplied - discountCents);
    let giftCardApplied = 0, giftCardCodeOut = null, giftCardBalance = 0;
    if (giftCardCode) {
        const gc = await validateGiftCard(orgId, giftCardCode);
        if (gc.ok) { giftCardApplied = Math.min(gc.balanceCents, totalCents); giftCardCodeOut = gc.code; giftCardBalance = gc.balanceCents; }
    }
    totalCents = Math.max(0, totalCents - giftCardApplied);

    return {
        lines, subtotalCents, wholesaleTotalCents, shippingCents, taxCents, rewardsApplied,
        discountCents, discountCode: promo.ok ? (promo.code || null) : null,
        discountTitle: subscribeDiscount ? "Subscribe & save" : (promo.ok && promo.automatic ? (promo.title || "Discount") : null),
        freeShipping, discountError: promoCode && !promo.ok ? promo.reason : null,
        giftCardApplied, giftCardCode: giftCardCodeOut, giftCardBalance,
        totalCents, errors,
    };
}

// Place a storefront order: validate the cart, create the order + items in the Pythias
// pipeline (so it shows on the floor and in the buyer's order history), then settle
// rewards (redeem applied credit, earn new credit). Returns a summary.
//
// NOTE: payment must be confirmed BEFORE calling this (next increment: Stripe webhook
// gates it). It's idempotent-friendly via `paymentRef` (skips if an order already exists).
export async function placeOrder({ orgId, site, customer, items, shippingAddress, email, redeemCents, promoCode, giftCardCode, subscribe, taxCents = 0, stripeFeeCents = 0, paymentRef, ip, analyticsSessionId }) {
    // Network fraud screening — a bad actor flagged by ANY store on the network is blocked here.
    const screen = await screenOrder({ email: email || customer?.email, phone: shippingAddress?.phone, shippingAddress, ip }).catch(() => null);
    if (screen?.level === "block") { const err = new Error("This order couldn't be completed. Please contact support."); err.code = "fraud_block"; throw err; }

    if (paymentRef) {
        const existing = await PlatformOrder.findOne({ orgId, paymentRef }).select("_id poNumber").lean();
        if (existing) return { orderId: String(existing._id), poNumber: existing.poNumber, duplicate: true };
    }

    const { lines, subtotalCents, wholesaleTotalCents, shippingCents, rewardsApplied: redeemApplied, discountCents, discountCode, giftCardApplied, giftCardCode: gcCode, totalCents } =
        await quoteCart({ orgId, site, customer, items, redeemCents, promoCode, giftCardCode, subscribe, taxCents });
    if (!lines.length) throw new Error("Cart is empty or unavailable");

    // Normalize the shipping address to the Order schema (required: name, address1, city, country).
    const sa = shippingAddress || {};
    const addr = {
        name: sa.name, phone: sa.phone,
        address1: sa.address1 || sa.line1, address2: sa.address2 || sa.line2,
        city: sa.city, state: sa.state, country: sa.country || "US", zip: sa.zip || sa.postalCode,
    };
    if (!addr.name || !addr.address1 || !addr.city) throw new Error("Shipping address is incomplete (name, address, city required)");

    // Resolve acquisition channel from the analytics session (for real per-order channel ROI).
    let attribution;
    if (analyticsSessionId) {
        const s = await StorefrontSession.findOne({ orgId, sessionId: analyticsSessionId }).select("utmSource utmMedium utmCampaign").lean().catch(() => null);
        if (s) attribution = { source: s.utmSource || "direct", medium: s.utmMedium, campaign: s.utmCampaign };
    }

    const poNumber = `SF${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
    const order = await PlatformOrder.create({
        orgId,
        marketplace: "Commerce Cloud",
        source: "storefront",
        ...(attribution ? { attribution } : {}),
        poNumber,
        orderId: poNumber,                 // required + unique
        shippingType: "shipping",          // CC storefront orders always ship
        date: new Date(),
        status: "awaiting_shipment",
        paid: true,
        customerEmail: email || customer?.email,
        shippingAddress: addr,
        shippingCost: shippingCents / 100,
        taxRate: subtotalCents > 0 ? taxCents / subtotalCents : 0,
        taxAmountCents: taxCents,
        total: totalCents / 100,
        discountAmount: (discountCents || 0) / 100,
        discountName: discountCode || undefined,
        rewardsRedeemedCents: redeemApplied,
        giftCardRedeemedCents: giftCardApplied || 0,
        giftCardCode: gcCode || undefined,
        storefrontCustomerId: customer?._id,
        paymentRef: paymentRef || undefined,
        // Captured now so the ship-settlement payout is a pure DB read (the Stripe fee
        // can't be recovered later). Transfer fires when the order ships.
        storefrontPayout: {
            subtotalCents,
            wholesaleCents: wholesaleTotalCents,
            stripeFeeCents,
            status: "pending",
        },
    });

    // One Item per unit (matches the rest of the pipeline's per-unit convention).
    const itemDocs = [];
    let idx = 0;
    for (const l of lines) {
        for (let n = 0; n < l.qty; n++) {
            itemDocs.push({
                pieceId: `${poNumber}-${idx++}`,    // required + unique
                status: "awaiting_shipment",         // required
                quantity: "1",                       // required (string)
                order: order._id, orgId, marketplace: "Commerce Cloud", poNumber, orderId: poNumber,
                styleCode: l.styleCode, colorName: l.colorName, sizeName: l.sizeName,
                // Routing refs (so routeOrder can match a provider) + artwork for the provider.
                blank: l.blankId || null,
                color: l.colorId || null,
                designRef: l.designRef || null,
                design: l.design || {},
                type: l.printType || null,
                name: l.title,
                price: l.priceCents / 100, sku: l.sku || undefined, product: l.productId,
                // Buyer personalization (custom-text design) — production renders artwork from this.
                ...(l.personalization ? { personalization: l.personalization, custom: true } : {}),
                // Multi-vertical routing tags (routeOrder splits the order by these).
                vertical: l.vertical || "pod",
                dropshipSupplierEmail: l.dropshipSupplierEmail || undefined,
                warehouseSku: l.warehouseSku || undefined,
            });
        }
    }
    if (itemDocs.length) await PlatformItem.insertMany(itemDocs);

    let earned = 0, wasFirstOrder = false;
    if (customer) {
        if (redeemApplied > 0) await redeemForOrder({ orgId, customerId: customer._id }, redeemApplied, order._id);
        earned = await earnForOrder({ orgId, customerId: customer._id }, site, subtotalCents, order._id);
        wasFirstOrder = !(customer.ordersCount > 0);
        await StorefrontCustomer.updateOne({ _id: customer._id }, { $inc: { ordersCount: 1, totalSpentCents: totalCents }, $set: { lastOrderAt: new Date(), winBackSentAt: undefined } }).catch(() => {});
    }
    if (discountCode) await consumeDiscount(orgId, discountCode).catch(() => {});
    if (gcCode && giftCardApplied > 0) await redeemGiftCard(orgId, gcCode, giftCardApplied, order._id).catch(() => {});

    // Order confirmation email (queued; outbox sends it). Best-effort.
    if (site) {
        await enqueueOrderConfirmation(site, {
            orgId, orderId: String(order._id), poNumber, email: email || customer?.email, customerId: customer?._id,
            lines: lines.map((l) => ({ label: [l.title, l.colorName, l.sizeName].filter(Boolean).join(" · "), qty: l.qty, amountCents: l.priceCents * l.qty })),
            totals: { totalCents },
        }).catch(() => {});
    }

    // Enroll the buyer into purchase automations (any order; plus first-order flows).
    if (site && customer) {
        await enrollFlows({ orgId, site, customer, trigger: "any_purchase", token: String(order._id) }).catch(() => {});
        if (wasFirstOrder) await enrollFlows({ orgId, site, customer, trigger: "first_purchase", token: "first" }).catch(() => {});
    }

    return { orderId: String(order._id), poNumber, subtotalCents, redeemApplied, earned, totalCents };
}
