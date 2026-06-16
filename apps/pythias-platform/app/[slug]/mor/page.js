import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { MoRClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function MoRPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <MoRClient />;
}
