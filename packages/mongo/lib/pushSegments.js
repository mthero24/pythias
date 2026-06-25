// Shared audience-segment filter for mobile-app push broadcasts. ONE definition used by both the
// platform (immediate send + recipient-count preview) and the storefront hourly cron (scheduled
// dispatch), so a scheduled push targets exactly the audience the seller previewed.
//
// Always tenant-scoped to `orgId` and always requires ≥1 registered Expo push token (the OS-level
// push-permission grant = consent). Segment conditions are layered on top. Unknown/missing → "all".

export const PUSH_SEGMENTS = ["all", "customers", "prospects", "abandoned_cart", "active_30"];

// Human labels for the composer dropdown / history display (kept here so platform + premier agree).
export const PUSH_SEGMENT_LABELS = {
    all: "All app users",
    customers: "Customers",
    prospects: "Prospects",
    abandoned_cart: "Abandoned cart",
    active_30: "Active last 30 days",
};

export function pushSegmentFilter(orgId, segment) {
    const base = { orgId, "pushTokens.0": { $exists: true } };
    switch (segment) {
        case "customers":
            return { ...base, ordersCount: { $gte: 1 } };
        case "prospects":
            return { ...base, $or: [{ ordersCount: { $lte: 0 } }, { ordersCount: { $exists: false } }] };
        case "abandoned_cart":
            return { ...base, "cart.0": { $exists: true } };
        case "active_30":
            return { ...base, lastSeenAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } };
        case "all":
        default:
            return base;
    }
}
