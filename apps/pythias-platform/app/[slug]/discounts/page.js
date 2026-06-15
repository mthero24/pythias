import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { DiscountsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <DiscountsClient />;
}
