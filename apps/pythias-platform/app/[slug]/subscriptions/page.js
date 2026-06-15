import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SubscriptionsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <SubscriptionsClient />;
}
