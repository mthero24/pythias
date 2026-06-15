import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AnalyticsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Storefront site analytics: live visitors, traffic, conversions, behavior, and page speed.
export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <AnalyticsClient />;
}
