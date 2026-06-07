import {
    ProviderCatalog,
    ProviderCapacity,
    ProviderLocation,
    ProviderScore,
    RoutingLog,
    Organization,
} from "@pythias/mongo";

// US state → region map for geography scoring
const STATE_REGION = {
    ME:"northeast", NH:"northeast", VT:"northeast", MA:"northeast", RI:"northeast",
    CT:"northeast", NY:"northeast", NJ:"northeast", PA:"northeast", DE:"northeast", MD:"northeast",
    VA:"southeast", WV:"southeast", NC:"southeast", SC:"southeast", GA:"southeast", FL:"southeast",
    AL:"southeast", MS:"southeast", TN:"southeast", KY:"southeast", AR:"southeast", LA:"southeast",
    OH:"midwest",   IN:"midwest",   MI:"midwest",   IL:"midwest",   WI:"midwest",   MN:"midwest",
    IA:"midwest",   MO:"midwest",   ND:"midwest",   SD:"midwest",   NE:"midwest",   KS:"midwest",
    MT:"west",      ID:"west",      WY:"west",      CO:"west",      UT:"west",      NV:"west",
    CA:"west",      OR:"west",      WA:"west",      AK:"west",      HI:"west",
    AZ:"southwest", NM:"southwest", TX:"southwest", OK:"southwest",
};

function calcGeoScore(providerLoc, shippingAddress) {
    if (!providerLoc) return 2;
    const pCountry = providerLoc.country || "US";
    const sCountry = shippingAddress.country || "US";
    if (pCountry !== sCountry) return 2;

    const pState = providerLoc.state;
    const sState = shippingAddress.state;
    if (pState && pState === sState) {
        // Same zip cluster = first 3 digits match (≈50-mile radius)
        const pZip3 = providerLoc.zip?.slice(0, 3);
        const sZip3 = shippingAddress.zip?.slice(0, 3);
        if (pZip3 && sZip3 && pZip3 === sZip3) return 40;
        return 32;
    }

    const pRegion = STATE_REGION[pState];
    const sRegion = STATE_REGION[sState];
    if (pRegion && pRegion === sRegion) return 22;
    return 10;
}

function calcPriceScore(totalWholesale, minCost, maxCost) {
    const range = maxCost - minCost;
    if (!range) return 30;
    return Math.round(30 * (1 - (totalWholesale - minCost) / range));
}

function calcReliabilityScore(providerScore, avgLeadTimeDays) {
    if (!providerScore) return 25; // reasonable default for new providers
    const onTime = (providerScore.onTimeRate30d ?? 1) * 15;
    const quality = (1 - (providerScore.defectRate30d ?? 0)) * 10;
    const speedBonus = (providerScore.avgShipDays30d ?? avgLeadTimeDays) < avgLeadTimeDays ? 5 : 0;
    return Math.min(30, Math.round(onTime + quality + speedBonus));
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Route a Commerce Cloud order to the best available fulfillment provider.
 *
 * @param {object} order   - Saved PlatformOrder document
 * @param {object[]} items - Saved PlatformItem documents for this order
 * @param {object} org     - Commerce Cloud Organization document (must include _id, wallet.balance)
 * @returns {{ routingLog, providerId } | { unroutable: true, reason: string }}
 */
export async function routeOrder(order, items, org) {
    // Step 1 — Build the list of required SKUs from the order items
    const required = items.map(item => ({
        blankId:  item.blank?.toString()  ?? item.blankId?.toString(),
        colorId:  item.color?.toString()  ?? item.colorId?.toString(),
        size:     item.sizeName,
    })).filter(r => r.blankId && r.colorId && r.size);

    if (!required.length) {
        return { unroutable: true, reason: "no_routable_items" };
    }

    // Step 2 — Eligibility filter: providers that accept Commerce Cloud, are not paused,
    //           and have not hit their daily cap
    const capacities = await ProviderCapacity.find({ acceptsCommerceCloud: true, isPaused: false }).lean();
    const eligible = capacities.filter(c => {
        if (c.pauseUntil && new Date(c.pauseUntil) > new Date()) return false;
        return c.currentDailyCount < c.maxDailyOrders;
    });

    if (!eligible.length) {
        return { unroutable: true, reason: "no_providers_available" };
    }

    const eligibleIds = eligible.map(c => c.providerId.toString());
    const capacityMap = Object.fromEntries(eligible.map(c => [c.providerId.toString(), c]));

    // Step 3 — Catalog check: keep only providers whose catalog covers ALL required SKUs,
    //           and compute the total wholesale cost for each
    const candidates = [];

    for (const providerId of eligibleIds) {
        const catalog = await ProviderCatalog.find({ providerId, active: true }).lean();

        const coversAll = required.every(req =>
            catalog.some(e =>
                e.blankId.toString() === req.blankId &&
                e.colorId.toString() === req.colorId &&
                e.size === req.size
            )
        );
        if (!coversAll) continue;

        const totalWholesale = required.reduce((sum, req) => {
            const entry = catalog.find(e =>
                e.blankId.toString() === req.blankId &&
                e.colorId.toString() === req.colorId &&
                e.size === req.size
            );
            return sum + (entry?.wholesalePrice ?? 0);
        }, 0);

        const avgLeadTime = catalog.reduce((s, e) => s + (e.leadTimeDays ?? 3), 0) / catalog.length;

        candidates.push({ providerId, totalWholesale, avgLeadTime });
    }

    if (!candidates.length) {
        return { unroutable: true, reason: "no_catalog_coverage" };
    }

    // Step 4 — Pull location and score data in bulk
    const providerIds = candidates.map(c => c.providerId);
    const [locations, scores] = await Promise.all([
        ProviderLocation.find({ providerId: { $in: providerIds }, isPrimary: true }).lean(),
        ProviderScore.find({ providerId: { $in: providerIds } }).lean(),
    ]);
    const locationMap = Object.fromEntries(locations.map(l => [l.providerId.toString(), l]));
    const scoreMap    = Object.fromEntries(scores.map(s => [s.providerId.toString(), s]));

    // Step 5 — Score each candidate
    const costs = candidates.map(c => c.totalWholesale);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    const scored = candidates.map(c => {
        const geo         = calcGeoScore(locationMap[c.providerId], order.shippingAddress ?? {});
        const price       = calcPriceScore(c.totalWholesale, minCost, maxCost);
        const reliability = calcReliabilityScore(scoreMap[c.providerId], c.avgLeadTime);
        let total = geo + price + reliability;

        // Warmup cap: new providers (< 50 orders) are capped at 50 composite points
        if (capacityMap[c.providerId]?.warmupMode) total = Math.min(50, total);

        return { ...c, geoScore: geo, priceScore: price, reliabilityScore: reliability, totalScore: total };
    }).sort((a, b) => b.totalScore - a.totalScore);

    const best = scored[0];

    // Step 6 — Verify the commerce org wallet has enough funds
    if ((org.wallet?.balance ?? 0) < best.totalWholesale) {
        return { unroutable: true, reason: "insufficient_wallet_balance" };
    }

    // Step 7 — Persist routing log
    // Internal providers (autoAccept: true) skip the 2-hour window and go straight to "accepted"
    const bestCapacity = capacityMap[best.providerId];
    const isAutoAccept = bestCapacity?.autoAccept === true;

    const routingLog = await new RoutingLog({
        orderId:            order._id,
        commerceOrgId:      org._id,
        selectedProviderId: best.providerId,
        candidates: scored.map(s => ({
            providerId:       s.providerId,
            geoScore:         s.geoScore,
            priceScore:       s.priceScore,
            reliabilityScore: s.reliabilityScore,
            totalScore:       s.totalScore,
        })),
        status:             isAutoAccept ? "accepted" : "routed",
        acceptanceDeadline: isAutoAccept ? null : new Date(Date.now() + 2 * 60 * 60 * 1000),
        acceptedAt:         isAutoAccept ? new Date() : undefined,
        totalWholesaleCost: best.totalWholesale,
    }).save();

    // Step 8 — Side effects (non-blocking failures are logged, not fatal)
    await Promise.allSettled([
        // Increment provider's daily count
        ProviderCapacity.updateOne(
            { providerId: best.providerId },
            { $inc: { currentDailyCount: 1 } }
        ),
        // Deduct wholesale cost from commerce org wallet
        Organization.updateOne(
            { _id: org._id },
            { $inc: { "wallet.balance": -best.totalWholesale } }
        ),
    ]);

    return { routingLog, providerId: best.providerId };
}
