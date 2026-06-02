export const TIERS = {
    starter: {
        label: 'Starter',
        price: 199,
        limits: {
            ordersPerMonth: 500,
            products: 250,
            designs: 100,
            integrations: 2,
            users: 5,
        },
        overage: {
            order: 0.25,
            product: 1.50,
            design: 0.50,
            user: 15,
        },
        allIntegrations: false,
    },
    professional: {
        label: 'Professional',
        price: 599,
        limits: {
            ordersPerMonth: 3000,
            products: 1500,
            designs: 500,
            integrations: 5,
            users: 10,
        },
        overage: {
            order: 0.15,
            product: 0.75,
            design: 0.25,
            user: 12,
        },
        allIntegrations: false,
    },
    business: {
        label: 'Business',
        price: 1499,
        limits: {
            ordersPerMonth: 15000,
            products: 10000,
            designs: 2000,
            integrations: -1,
            users: 25,
        },
        overage: {
            order: 0.08,
            product: 0.35,
            design: 0.12,
            user: 10,
        },
        allIntegrations: true,
    },
    scale: {
        label: 'Scale',
        price: 3000,
        limits: {
            ordersPerMonth: -1,
            products: -1,
            designs: -1,
            integrations: -1,
            users: 50,
        },
        overage: {
            order: 0,
            product: 0,
            design: 0,
            user: 8,
        },
        allIntegrations: true,
    },
    enterprise: {
        label: 'Enterprise',
        price: 5500,
        limits: {
            ordersPerMonth: -1,
            products: -1,
            designs: -1,
            integrations: -1,
            users: -1,
        },
        overage: {
            order: 0,
            product: 0,
            design: 0,
            user: 0,
        },
        allIntegrations: true,
    },
};

// -1 means unlimited
export function getLimits(tier) {
    return TIERS[tier]?.limits ?? TIERS.starter.limits;
}

export function getOverageRate(tier, resource) {
    return TIERS[tier]?.overage?.[resource] ?? 0;
}

export function isUnlimited(limit) {
    return limit === -1;
}

export function calcOverage(usage, limit, ratePerUnit) {
    if (isUnlimited(limit) || ratePerUnit === 0) return 0;
    const over = Math.max(0, usage - limit);
    return over * ratePerUnit;
}

// Crossover: at what usage does it become cheaper to upgrade?
export function crossoverUsage(currentTier, nextTier, resource) {
    const cur = TIERS[currentTier];
    const next = TIERS[nextTier];
    if (!cur || !next) return null;
    const priceDiff = next.price - cur.price;
    const rate = cur.overage[resource];
    if (!rate) return null;
    return cur.limits[resource === 'order' ? 'ordersPerMonth' : `${resource}s`] + Math.ceil(priceDiff / rate);
}
