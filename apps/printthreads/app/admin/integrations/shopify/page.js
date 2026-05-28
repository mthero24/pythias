import { ApiKeyIntegrations, ShopifyUserData } from "@pythias/mongo";
import { ShopifyDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function ShopifyPage({ searchParams }) {
    const params = await searchParams;
    const connectionId = params?.connectionId;

    let connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ provider: "printthreads", displayName: /^shopify-/ }).lean();

    if (!connection) {
        // Fall back to ShopifyUserData (connection may have been created before the provider fix)
        const shopifyUser = connectionId
            ? await ShopifyUserData.findById(connectionId).lean()
            : await ShopifyUserData.findOne({ provider: "Print Threads" }).lean();
        if (shopifyUser) {
            connection = {
                _id: shopifyUser._id,
                displayName: `shopify-${shopifyUser.shop}`,
                apiKey: shopifyUser.pythiasToken,
                type: "shopify",
                provider: "printthreads",
            };
        }
    }

    if (!connection) notFound();

    return <ShopifyDashboard connection={serialize(connection)} />;
}
