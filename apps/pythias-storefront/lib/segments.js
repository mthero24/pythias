// Build a Mongo filter (over StorefrontCustomer) from a segment's rules. Shared by campaign
// targeting and flow audience filtering. Pure — no DB access.
export function buildSegmentFilter(segment) {
    const conds = segment?.rules?.conditions || [];
    const now = Date.now();
    const clauses = [];
    for (const c of conds) {
        const v = c.value;
        switch (c.field) {
            case "emailConsent": clauses.push({ "marketingConsent.email.optedIn": c.op === "is" ? !!v : true }); break;
            case "smsConsent":   clauses.push({ "marketingConsent.sms.optedIn": c.op === "is" ? !!v : true }); break;
            case "isLead":       clauses.push({ isLead: c.op === "is" ? !!v : true }); break;
            case "emailVerified":clauses.push({ emailVerified: c.op === "is" ? !!v : true }); break;
            case "ordersCount":  clauses.push({ ordersCount: { [c.op === "lte" ? "$lte" : c.op === "eq" ? "$eq" : "$gte"]: Number(v) || 0 } }); break;
            case "totalSpentCents": clauses.push({ totalSpentCents: { [c.op === "lte" ? "$lte" : "$gte"]: Number(v) || 0 } }); break;
            case "rewardsBalance":  clauses.push({ rewardsBalance: { [c.op === "lte" ? "$lte" : "$gte"]: Number(v) || 0 } }); break;
            // "days ago" → date thresholds. gte days ago = older than N (date <= now-N).
            case "lastOrderDaysAgo": clauses.push({ lastOrderAt: c.op === "lte" ? { $gte: new Date(now - (Number(v) || 0) * 864e5) } : { $lte: new Date(now - (Number(v) || 0) * 864e5) } }); break;
            case "signupDaysAgo":    clauses.push({ createdAt: c.op === "lte" ? { $gte: new Date(now - (Number(v) || 0) * 864e5) } : { $lte: new Date(now - (Number(v) || 0) * 864e5) } }); break;
            default: break;
        }
    }
    if (!clauses.length) return {};
    return { [segment?.rules?.match === "any" ? "$or" : "$and"]: clauses };
}
