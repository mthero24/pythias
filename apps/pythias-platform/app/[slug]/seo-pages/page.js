import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Organization } from "@pythias/mongo";
import { SeoPagesClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Seller-built custom / SEO keyword landing pages for their storefront.
export default async function SeoPagesPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    const org = await Organization.findById(session.user.orgId).select("slug").lean();
    const base = process.env.STOREFRONT_PUBLIC_BASE || "pythias.store";
    const viewBase = org?.slug ? `https://${org.slug}.${base}` : "";
    return <SeoPagesClient viewBase={viewBase} />;
}
