import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PayoutsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Commerce Cloud sellers connect their Stripe account here so storefront sales pay out to them.
// Pythias (the marketplace account) collects buyer payments and transfers each seller's net.
export default async function PayoutsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <PayoutsClient />;
}
