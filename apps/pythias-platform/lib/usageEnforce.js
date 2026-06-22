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

// Recompute the usage counters from the live collections. The $inc counters drift if ANY
// create/delete/import path misses incrementUsage, so this is the source of truth for the
// dashboard (and corrects the stored counters that billing/overage read).
export async function recountUsage(orgId) {
    const { PlatformProduct, PlatformDesign, PlatformOrder } = await import("@pythias/mongo");
    const org = await Organization.findById(orgId).select("usage.periodStart").lean();
    const periodStart = org?.usage?.periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [productsTotal, designsTotal, ordersThisMonth] = await Promise.all([
        PlatformProduct.countDocuments({ orgId }),
        PlatformDesign.countDocuments({ orgId }),
        PlatformOrder.countDocuments({ orgId, date: { $gte: periodStart } }),
    ]);
    await Organization.findByIdAndUpdate(orgId, { $set: {
        "usage.productsTotal": productsTotal, "usage.designsTotal": designsTotal, "usage.ordersThisMonth": ordersThisMonth,
    } });
    return { productsTotal, designsTotal, ordersThisMonth };
}
