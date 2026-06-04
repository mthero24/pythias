import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { EbayDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function EbayPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const orgId = session.user.orgId;

    const connections = await ApiKeyIntegrations
        .find({ $or: [{ type: "ebay", orgId }, { type: "ebay", provider: slug, orgId: null }] })
        .sort({ _id: -1 })
        .lean()
        .catch(() => []);

    if (!connections.length) notFound();
    return <EbayDashboard connections={serialize(connections)} />;
}
