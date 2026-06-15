import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AutomationsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <AutomationsClient />;
}
