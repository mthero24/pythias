import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ApiKeyIntegrations, ShopifyUserData } from "@pythias/mongo";
import { ShopifyDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function ShopifyPage({ params, searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const sp = await searchParams;
    const orgId = session.user.orgId;
    const connectionId = sp?.connectionId;

    let connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({
            $or: [
                { displayName: /^shopify-/, orgId },
                { displayName: /^shopify-/, provider: slug, orgId: null },
            ],
          }).lean();

    if (!connection) {
        const shopifyUser = connectionId
            ? await ShopifyUserData.findById(connectionId).lean()
            : await ShopifyUserData.findOne({ provider: slug }).lean()
              ?? await ShopifyUserData.findOne({ provider: "Premier Printing" }).lean();
        if (shopifyUser) {
            connection = {
                _id: shopifyUser._id,
                displayName: `shopify-${shopifyUser.shop}`,
                apiKey: shopifyUser.pythiasToken,
                type: "shopify",
                provider: slug,
            };
        }
    }

    if (!connection) notFound();
    return <ShopifyDashboard connection={serialize(connection)} />;
}
