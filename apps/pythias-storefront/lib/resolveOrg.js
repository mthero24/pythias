import { StorefrontSite } from "@pythias/mongo";
import { resolveSite } from "@/lib/resolveSite";

// Resolve the request's storefront org. Web sends a Host header; the white-label mobile
// app sends an x-pythias-app-key header (no host). Returns { orgId, site } or null.
export async function resolveOrg(req) {
    const appKey = req.headers.get("x-pythias-app-key");
    if (appKey) {
        const site = await StorefrontSite.findOne({ appKey }).lean();
        if (site && site.status !== "disabled") return { orgId: site.orgId, site };
        return null;
    }
    const site = await resolveSite(req.headers.get("host"));
    return site ? { orgId: site.orgId, site } : null;
}
