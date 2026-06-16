import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { DemandClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function DemandPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <DemandClient />;
}
