import Stripe from "stripe";

// Resolve the Stripe secret across the two env-var conventions used in this app
// (`stripeSecret` and `STRIPE_SECRET_KEY`) so wallet/billing code works in any env.
export function getStripe() {
    const key = process.env.stripeSecret || process.env.STRIPE_SECRET_KEY;
    return new Stripe(key);
}
