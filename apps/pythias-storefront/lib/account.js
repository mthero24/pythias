import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { bearer, verifyToken } from "@/lib/auth";

// Resolve the authenticated customer for an account endpoint. Verifies the bearer token,
// confirms it belongs to THIS storefront's org (host or app-key), and loads the customer.
// Returns { orgId, customer } or null.
export async function getAuthedCustomer(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return null;
    const claims = verifyToken(bearer(req));
    if (!claims || String(claims.org) !== String(ctx.orgId)) return null;
    const customer = await StorefrontCustomer.findOne({ _id: claims.sub, orgId: ctx.orgId }).lean();
    if (!customer) return null;
    return { orgId: ctx.orgId, customer };
}

// Carrier tracking URL for the UI (best effort).
export function trackingUrl(carrier, num) {
    if (!num) return null;
    const c = String(carrier || "").toLowerCase();
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    if (c.includes("ups"))  return `https://www.ups.com/track?tracknum=${num}`;
    if (c.includes("fedex"))return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`${carrier || ""} ${num}`)}`;
}
