import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { MarketingClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Storefront marketing: campaigns (email/SMS, AI-assisted) + the signup-popup config.
export default async function MarketingPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <MarketingClient />;
}
