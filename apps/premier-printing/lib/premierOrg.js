import { Organization } from "@pythias/mongo";
let cached = null;
// Premier's Organization in the shared platform DB (it's a provider/fulfillment org).
export async function getPremierOrgId() {
    if (cached) return cached;
    const org = await Organization.findOne({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" }).select("_id").lean();
    cached = org?._id || null;
    return cached;
}
