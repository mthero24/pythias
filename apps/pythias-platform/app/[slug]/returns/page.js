import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ReturnsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ReturnsClient />;
}
