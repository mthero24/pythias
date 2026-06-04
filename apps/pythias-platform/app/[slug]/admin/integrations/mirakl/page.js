import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { MiraklDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function MiraklPage({ params, searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const sp = await searchParams;
    const orgId = session.user.orgId;
    const connectionId = sp?.connectionId;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({
            $or: [{ type: "mirakl", orgId }, { type: "mirakl", provider: slug, orgId: null }],
          }).lean();

    if (!connection) notFound();
    return <MiraklDashboard connection={serialize(connection)} />;
}
