import { notFound } from "next/navigation";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { EbayDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function EbayPage() {
    const connections = await ApiKeyIntegrations
        .find({ type: "ebay", provider: "premierPrinting" })
        .sort({ _id: -1 })
        .lean()
        .catch(() => []);
    if (!connections.length) notFound();
    return <EbayDashboard connections={serialize(connections)} />;
}
