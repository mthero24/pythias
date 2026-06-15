import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ProfitClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function ProfitPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ProfitClient />;
}
