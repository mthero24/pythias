import Stripe from "stripe";

// Storefront/marketplace Stripe — SEPARATE from the platform's subscription-billing account
// (clean accounting + risk/tax isolation). Lazy so importing never throws when unconfigured.
let _stripe;
export function storefrontStripe() {
    const key = process.env.STOREFRONT_STRIPE_SECRET;
    if (!key) return null;
    if (!_stripe) _stripe = new Stripe(key);
    return _stripe;
}

export const STOREFRONT_PUBLISHABLE_KEY = process.env.STOREFRONT_STRIPE_PUBLISHABLE || null;
export const STOREFRONT_WEBHOOK_SECRET = process.env.STOREFRONT_STRIPE_WEBHOOK_SECRET || null;

// Stripe Tax: calculate sales tax for the cart at the buyer's address. Returns
// { taxCents, calcId } — calcId is recorded as a tax transaction on payment success.
// Degrades to 0 if there's no usable address or Stripe Tax isn't enabled on the account.
export async function computeTax(stripe, { currency = "usd", lines = [], shippingCents = 0, address = {} }) {
    const a = address || {};
    if (!stripe || !a.address1 || !a.city || !a.country) return { taxCents: 0, calcId: null };
    try {
        const calc = await stripe.tax.calculations.create({
            currency,
            line_items: lines.map((l, i) => ({ amount: l.lineTotalCents, reference: l.sku || l.productId || `line${i}`, tax_behavior: "exclusive" })),
            shipping_cost: shippingCents > 0 ? { amount: shippingCents } : undefined,
            customer_details: {
                address: { line1: a.address1, line2: a.address2 || undefined, city: a.city, state: a.state, postal_code: a.zip, country: a.country },
                address_source: "shipping",
            },
        });
        return { taxCents: calc.tax_amount_exclusive ?? 0, calcId: calc.id };
    } catch (e) {
        // Stripe Tax not enabled / address not taxable → proceed without tax.
        console.warn("[storefront tax] calculation skipped:", e.message);
        return { taxCents: 0, calcId: null };
    }
}
