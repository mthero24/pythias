// Storefront add-on subscription plans. Prices here are DEFAULTS used to build a Stripe
// subscription via price_data (so it works without pre-creating Stripe products). To bill against
// a real Stripe Price instead, set the matching env var (e.g. STOREFRONT_STARTER_PRICE_ID) and the
// subscribe route uses that price id. ⚠️ Confirm the monthly prices before going live.
export const STOREFRONT_PLANS = {
    starter: {
        key: "starter", name: "Starter", monthlyCents: 4900, priceEnv: "STOREFRONT_STARTER_PRICE_ID",
        includedStores: 1, extraStoreCents: 2500,   // each store beyond the included count
        blurb: "Everything to launch a real store.",
        features: ["1 storefront included", "Custom domain + themes", "Unlimited products & collections", "Discounts, gift cards & reviews", "Email & SMS marketing", "Site + profit analytics"],
    },
    pro: {
        key: "pro", name: "Pro", monthlyCents: 14900, priceEnv: "STOREFRONT_PRO_PRICE_ID", popular: true,
        includedStores: 3, extraStoreCents: 7500,
        blurb: "Scale with AI and automation.",
        features: ["3 storefronts included", "Everything in Starter", "AI Store Autopilot + concierge", "Demand forecasting + auto-restock", "Automations, segments & A/B testing", "International (multi-language/currency)"],
    },
    enterprise: {
        key: "enterprise", name: "Enterprise", monthlyCents: 39900, priceEnv: "STOREFRONT_ENTERPRISE_PRICE_ID",
        includedStores: 5, extraStoreCents: 20000,
        blurb: "The full network advantage.",
        features: ["5 storefronts included", "Everything in Pro", "Merchant of Record (tax + chargebacks)", "Network fraud & deliverability shield", "Multi-vertical cart + earn as fulfiller", "Priority support & onboarding"],
    },
};

export const PLAN_ORDER = ["starter", "pro", "enterprise"];

// Shared (server) view of plan store-limits — used by the multi-store services in @pythias/backend.
export const STOREFRONT_PLAN_LIMITS = Object.fromEntries(
    Object.values(STOREFRONT_PLANS).map((p) => [p.key, { includedStores: p.includedStores, extraStoreCents: p.extraStoreCents, monthlyCents: p.monthlyCents }])
);
