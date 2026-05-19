import { ApiKeyIntegrations } from "@pythias/mongo";
import { MiraklDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function MiraklPage({ searchParams }) {
    const params = await searchParams;
    const connectionId = params?.connectionId;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ type: "mirakl" }).lean();

    if (!connection) notFound();

    return <MiraklDashboard connection={serialize(connection)} />;
}
