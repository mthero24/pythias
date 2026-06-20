import { PlatformOrder, PlatformItem, StorefrontCustomer, StorefrontSession, screenOrder } from "@pythias/mongo";
import { validateCart } from "@/lib/cart";
import { enrollFlows } from "@/lib/flows";
import { computeRedeemable, redeemForOrder, earnForOrder } from "@/lib/rewards";
import { validateDiscount, bestAutomaticDiscount, consumeDiscount, validateGiftCard, redeemGiftCard } from "@/lib/discounts";
import { enqueueOrderConfirmation } from "@/lib/emailFlows";
import { shippingOptions, shippingRate } from "@/lib/shipping";

// Legacy single-number helper (domestic standard). The full engine is in lib/shipping.js.
export function computeShipping(site, subtotalCents, itemCount = 1) {
    return shippingRate(site, { subtotalCents, itemCount, country: site?.shipping?.homeCountry }).amountCents || 0;
}

// Seller-configured cart add-ons (gift bag, gift message, branding…) — priced authoritatively from the
// site config (never trust the client). Returns the added cost + the chosen add-on lines (for the order).
export function resolveAddOns(site, selected = {}) {
    const config = site?.cartAddOns || [];
    let addOnsCents = 0; const addOnLines = [];
    for (const a of config) {
        if (a.enabled === false || !a.id) continue;
        const val = selected[a.id];
        const isMessage = a.type === "message";
        const chosen = isMessage ? (typeof val === "string" && val.trim().length > 0) : !!val;
        if (!chosen) continue;
        addOnsCents += a.priceCents || 0;
        addOnLines.push({ id: a.id, label: a.label || a.id, priceCents: a.priceCents || 0, ...(isMessage ? { message: String(val).trim().slice(0, 500) } : {}) });
    }
    return { addOnsCents, addOnLines };
}

// Single source of truth for cart totals — used by summary, payment intent, and placement.
// taxCents is 0 in the cart/summary and the real Stripe Tax amount at the payment step.
export async function quoteCart({ orgId, site, customer, items, redeemCents, promoCode, giftCardCode, subscribe, taxCents = 0, addOns = {}, shippingCountry, shippingMethod }) {
    const { lines, subtotalCents: productSubtotal, wholesaleTotalCents, errors } = await validateCart(orgId, items);
    const { addOnsCents, addOnLines } = resolveAddOns(site, addOns);
    const subtotalCents = productSubtotal + addOnsCents;   // add-ons count toward the order total
    const itemCount = lines.reduce((n, l) => n + (l.qty || 1), 0);

    // Subscribe & save replaces other code/automatic discounts; otherwise an explicit code wins,
    // else the best AUTOMATIC (codeless) discount applies.
    let promo = { ok: false }, discountCents = 0, freeShipping = false, subscribeDiscount = false, discountError = null;
    if (subscribe && site?.subscriptions?.enabled) {
        discountCents = Math.round((subtotalCents * (site.subscriptions.discountPercent || 0)) / 100);
        subscribeDiscount = true;
    } else {
        // Only ONE discount applies to an order — the GREATER of an entered code vs the best automatic
        // discount (a buyer entering a code never loses a bigger automatic deal, and they don't stack).
        const coded = promoCode ? await validateDiscount(orgId, promoCode, subtotalCents) : { ok: false };
        const auto = await bestAutomaticDiscount(orgId, subtotalCents);
        const weight = (r) => (r?.ok ? (r.discountCents || 0) + (r.freeShipping ? 1 : 0) : -1);
        promo = weight(coded) >= weight(auto) ? coded : auto;
        discountCents = promo.ok ? promo.discountCents : 0;
        freeShipping = !!(promo.ok && promo.freeShipping);
        if (promoCode && !coded.ok) discountError = coded.reason;   // surface an invalid code even if an auto discount applied
    }

    const rewardsApplied = customer ? computeRedeemable(site, customer.rewardsBalance || 0, subtotalCents, redeemCents) : 0;

    // Shipping: the available methods for the buyer's country + the rate for the one they picked. A
    // country the seller doesn't ship to yields no options → shipsTo:false (checkout is blocked upstream).
    // Free-shipping-over-$ threshold applies to the POST-discount subtotal — a discount can drop an
    // order below it (e.g. $100 free-ship threshold, $100 cart − $12 discount = $88 → not free).
    const ship = shippingOptions(site, { subtotalCents: Math.max(0, subtotalCents - discountCents), itemCount, country: shippingCountry });
    const chosen = ship.options.find((o) => o.id === shippingMethod) || ship.options[0] || null;
    const shippingCents = freeShipping ? 0 : (chosen?.amountCents || 0);

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
        itemCount,
        shipsTo: ship.shipsTo, shippingOptions: ship.options, shippingMethod: chosen?.id || null, shippingMethodLabel: chosen?.label || null,
        addOnsCents, addOnLines,
        discountCents, discountCode: promo.ok ? (promo.code || null) : null,
        discountTitle: subscribeDiscount ? "Subscribe & save" : (promo.ok && promo.automatic ? (promo.title || "Discount") : null),
        freeShipping, discountError,
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
export async function placeOrder({ orgId, site, customer, items, shippingAddress, email, redeemCents, promoCode, giftCardCode, subscribe, taxCents = 0, stripeFeeCents = 0, paymentRef, ip, analyticsSessionId, addOns = {}, shippingMethod, notifyOptIn = false, marketingOptIn = false, consentText }) {
    // Network fraud screening — a bad actor flagged by ANY store on the network is blocked here.
    const screen = await screenOrder({ email: email || customer?.email, phone: shippingAddress?.phone, shippingAddress, ip }).catch(() => null);
    if (screen?.level === "block") { const err = new Error("This order couldn't be completed. Please contact support."); err.code = "fraud_block"; throw err; }

    if (paymentRef) {
        const existing = await PlatformOrder.findOne({ orgId, paymentRef }).select("_id poNumber").lean();
        if (existing) return { orderId: String(existing._id), poNumber: existing.poNumber, duplicate: true };
    }

    const { lines, subtotalCents, wholesaleTotalCents, shippingCents, rewardsApplied: redeemApplied, discountCents, discountCode, discountTitle, giftCardApplied, giftCardCode: gcCode, totalCents, addOnLines, shipsTo, shippingMethodLabel } =
        await quoteCart({ orgId, site, customer, items, redeemCents, promoCode, giftCardCode, subscribe, taxCents, addOns, shippingCountry: shippingAddress?.country, shippingMethod });
    if (!lines.length) throw new Error("Cart is empty or unavailable");
    if (!shipsTo) { const err = new Error("This store doesn't ship to your country."); err.code = "ships_to"; throw err; }

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
        ...(addOnLines?.length ? { giftAddOns: addOnLines } : {}),
        ...((notifyOptIn || marketingOptIn) ? { consent: { orderUpdates: !!notifyOptIn, marketing: !!marketingOptIn, phone: addr.phone || undefined, text: consentText, at: new Date() } } : {}),
        shippingCost: shippingCents / 100,
        ...(shippingMethodLabel ? { shippingMethod: shippingMethodLabel } : {}),
        taxRate: subtotalCents > 0 ? taxCents / subtotalCents : 0,
        taxAmountCents: taxCents,
        total: totalCents / 100,
        discountAmount: (discountCents || 0) / 100,
        // Automatic discounts have no code — keep the buyer-readable title so the order shows a name.
        discountName: discountCode || discountTitle || undefined,
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
                // Pre-made products carry a design map; "create your own" custom lines build it from
                // the per-side artwork so production (DTF/GTX) has a design keyed by print location.
                design: (l.design && Object.keys(l.design).length)
                    ? l.design
                    : Object.fromEntries((l.personalization?.sides || []).filter((s) => s.artworkUrl && s.location).map((s) => [s.location, s.artworkUrl])),
                type: l.printType || null,
                name: l.title,
                ...(l.printLocation ? { printLocation: l.printLocation } : {}),
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
    // Gift add-ons become their OWN items so production handles them (add a gift bag, print the message,
    // brand the package). One per add-on (not per unit); no blank/design so routing leaves them in-house.
    for (const a of (addOnLines || [])) {
        itemDocs.push({
            pieceId: `${poNumber}-${idx++}`, status: "awaiting_shipment", quantity: "1",
            order: order._id, orgId, marketplace: "Commerce Cloud", poNumber, orderId: poNumber,
            name: a.label, price: (a.priceCents || 0) / 100,
            addOn: true, addOnType: a.id,
            ...(a.message ? { giftMessage: a.message } : {}),
            vertical: "pod",
        });
    }
    // Insert the per-unit items AND link them back onto the order's `items` array — the
    // platform/premier order views read items via `.populate("items")` (the array), not the
    // item→order back-ref. Without this the seller's order shows with no line items.
    if (itemDocs.length) {
        const insertedItems = await PlatformItem.insertMany(itemDocs);
        await PlatformOrder.updateOne({ _id: order._id }, { $set: { items: insertedItems.map((d) => d._id) } });
    }

    let earned = 0, wasFirstOrder = false;
    if (customer) {
        if (redeemApplied > 0) await redeemForOrder({ orgId, customerId: customer._id }, redeemApplied, order._id);
        earned = await earnForOrder({ orgId, customerId: customer._id }, site, subtotalCents, order._id);
        wasFirstOrder = !(customer.ordersCount > 0);
        await StorefrontCustomer.updateOne({ _id: customer._id }, { $inc: { ordersCount: 1, totalSpentCents: totalCents }, $set: { lastOrderAt: new Date(), winBackSentAt: undefined } }).catch(() => {});
    }
    // Record communication consent so the marketing + transactional channels honor it. A guest who
    // opts into marketing becomes a lead (claimable later by signup); order updates just persist the phone.
    const consentEmail = (email || customer?.email || "").toLowerCase();
    const wantCustomerWrite = marketingOptIn || (notifyOptIn && addr.phone);
    if (wantCustomerWrite && consentEmail) {
        const now = new Date();
        const set = {};
        if (addr.phone) set.phone = addr.phone;
        if (marketingOptIn) {
            Object.assign(set, {
                "marketingConsent.email.optedIn": true,
                "marketingConsent.email.at": now,
                "marketingConsent.email.source": "checkout",
                ...(consentText ? { "marketingConsent.email.text": consentText } : {}),
                ...(ip ? { "marketingConsent.email.ip": ip } : {}),
            });
        }
        await StorefrontCustomer.updateOne(
            { orgId, email: consentEmail },
            { $set: set, $setOnInsert: { isLead: !customer } },
            { upsert: true },
        ).catch(() => { /* consent is best-effort; never block the order */ });
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
