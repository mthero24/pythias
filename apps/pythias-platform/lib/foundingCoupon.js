// Maps a founding org's tier → the Stripe coupon to auto-apply on its subscription Checkout, so the
// "25% off for life" (and early-bird / early-adopter) offers are honored automatically — no manual
// coupon attaching. Coupon IDs are env-driven so they can change without a code edit:
//   STRIPE_COUPON_FOUNDER     — founder    (25% off, forever)
//   STRIPE_COUPON_EARLY_BIRD  — early_bird (20% off, 12 months)
//   STRIPE_COUPON_EARLY_YEAR  — early_year (10% off, 12 months)
const TIER_COUPON = {
    founder:    process.env.STRIPE_COUPON_FOUNDER,
    early_bird: process.env.STRIPE_COUPON_EARLY_BIRD,
    early_year: process.env.STRIPE_COUPON_EARLY_YEAR,
};

// Returns the Stripe Checkout `discounts` array for a founding org, or [] (spread-safe) otherwise.
export function foundingDiscounts(org) {
    const id = org?.founder && org?.foundingTier ? TIER_COUPON[org.foundingTier] : null;
    return id ? [{ coupon: id }] : [];
}
