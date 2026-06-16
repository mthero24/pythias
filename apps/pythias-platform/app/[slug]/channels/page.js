import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ChannelsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ChannelsClient />;
}
