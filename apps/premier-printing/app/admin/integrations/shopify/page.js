import { ApiKeyIntegrations } from "@pythias/mongo";
import { ShopifyDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function ShopifyPage({ searchParams }) {
    const params = await searchParams;
    const connectionId = params?.connectionId;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ displayName: /^shopify-/ }).lean();

    if (!connection) notFound();

    return <ShopifyDashboard connection={serialize(connection)} />;
}
