// Storefront shipping rate engine. One place that turns the seller's `site.shipping` config into the
// concrete options a buyer sees at checkout, given their country + item count + subtotal.
//
// Pricing model: amount = baseCents + perItemCents × (items beyond the first). Standard is always
// offered domestically; expedited/2-day/next-day are optional faster tiers. International ships only to
// the countries the seller listed — a buyer anywhere else is BLOCKED (shipsTo:false → can't check out).

const FAST_TIERS = [
    { key: "expedited", id: "expedited", label: "Expedited" },
    { key: "twoDay", id: "twoDay", label: "2-Day" },
    { key: "nextDay", id: "nextDay", label: "Next Day" },
];

const eta = (mn, mx) => (mn && mx ? { minDays: mn, maxDays: mx } : mn ? { minDays: mn, maxDays: mn } : null);
const itemsCost = (baseCents, perItemCents, itemCount) =>
    Math.max(0, (baseCents || 0) + (perItemCents || 0) * Math.max(0, (itemCount || 1) - 1));

// All shipping options available for an order to `country`. Returns { shipsTo, options:[{id,label,amountCents,eta}] }.
// shipsTo:false means the seller doesn't ship there → checkout must be blocked.
export function shippingOptions(site, { subtotalCents = 0, itemCount = 1, country } = {}) {
    const s = site?.shipping || {};
    const home = (s.homeCountry || "US").toUpperCase();
    const c = (country || home).toUpperCase();

    if (c === home) {
        const options = [];
        const stdBase = s.baseCents || s.flatRateCents || 0;   // legacy flatRateCents → base
        let stdCents = itemsCost(stdBase, s.perItemCents, itemCount);
        const freeBySpend = s.freeOverCents > 0 && subtotalCents >= s.freeOverCents;
        const freeByCount = s.freeOverItems > 0 && itemCount >= s.freeOverItems;
        if (s.freeShipping || freeBySpend || freeByCount) stdCents = 0;
        options.push({ id: "standard", label: "Standard", amountCents: stdCents, eta: eta(s.standardMinDays, s.standardMaxDays) });
        for (const t of FAST_TIERS) {
            const m = s[t.key];
            if (m?.enabled) options.push({ id: t.id, label: t.label, amountCents: itemsCost(m.baseCents, m.perItemCents, itemCount), eta: eta(m.minDays, m.maxDays) });
        }
        return { shipsTo: true, options };
    }

    // International
    if (!s.international?.enabled) return { shipsTo: false, options: [] };
    const match = (s.international.countries || []).find((x) => (x.code || "").toUpperCase() === c);
    if (!match) return { shipsTo: false, options: [] };
    return { shipsTo: true, options: [{ id: "standard", label: "International", amountCents: itemsCost(match.baseCents, match.perItemCents, itemCount), eta: eta(match.minDays, match.maxDays) }] };
}

// The rate for a specific chosen method (falls back to the cheapest/first option). Returns
// { shipsTo, amountCents, methodId, label }.
export function shippingRate(site, { subtotalCents, itemCount, country, methodId = "standard" } = {}) {
    const { shipsTo, options } = shippingOptions(site, { subtotalCents, itemCount, country });
    if (!shipsTo || !options.length) return { shipsTo: false, amountCents: 0, methodId: null, label: null };
    const opt = options.find((o) => o.id === methodId) || options[0];
    return { shipsTo: true, amountCents: opt.amountCents, methodId: opt.id, label: opt.label };
}
