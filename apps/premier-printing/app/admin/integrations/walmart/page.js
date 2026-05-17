import { ApiKeyIntegrations } from "@pythias/mongo";
import { WalmartDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function WalmartPage({ searchParams }) {
    const params = await searchParams;
    const connectionId = params?.connectionId;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ type: "walmart" }).lean();

    if (!connection) notFound();

    return <WalmartDashboard connection={serialize(connection)} />;
}
