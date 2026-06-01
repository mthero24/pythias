import { Organization } from "@pythias/mongo";
import { isUnlimited } from "./tiers";

export class UsageLimitError extends Error {
    constructor(resource, limit) {
        super(`${resource} limit reached (${limit})`);
        this.resource = resource;
        this.limit = limit;
        this.status = 429;
    }
}

// Call before creating an order/product/design/user. Throws UsageLimitError if hard-blocked.
// Hard-block only on users (to keep billing clean). Orders/products/designs allow overage (billed).
export async function checkUsage(orgId, resource) {
    const org = await Organization.findById(orgId).lean();
    if (!org) throw new Error("Organization not found");

    const limit = org.limits[resource === 'order' ? 'ordersPerMonth' : `${resource}s`];
    if (isUnlimited(limit)) return;

    const current = resource === 'order'
        ? org.usage.ordersThisMonth
        : resource === 'product'
            ? org.usage.productsTotal
            : resource === 'design'
                ? org.usage.designsTotal
                : org.usage.usersTotal;

    // Users are hard-blocked (cannot exceed without paying extra seat)
    if (resource === 'user' && current >= limit) {
        throw new UsageLimitError('users', limit);
    }
}

export async function incrementUsage(orgId, resource, delta = 1) {
    const field = resource === 'order'
        ? 'usage.ordersThisMonth'
        : resource === 'product'
            ? 'usage.productsTotal'
            : resource === 'design'
                ? 'usage.designsTotal'
                : 'usage.usersTotal';

    await Organization.findByIdAndUpdate(orgId, { $inc: { [field]: delta } });
}

export async function resetMonthlyUsage(orgId) {
    await Organization.findByIdAndUpdate(orgId, {
        'usage.ordersThisMonth': 0,
        'usage.periodStart': new Date(),
    });
}
