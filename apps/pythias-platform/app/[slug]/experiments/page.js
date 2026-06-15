import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ExperimentsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function ExperimentsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ExperimentsClient />;
}
