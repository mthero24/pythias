import { ApiKeyIntegrations } from "@pythias/mongo";
import { AcendaDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function AcendaPage({ searchParams }) {
    const params = await searchParams;
    const connectionId = params?.connectionId;

    const connection = connectionId
        ? await ApiKeyIntegrations.findById(connectionId).lean()
        : await ApiKeyIntegrations.findOne({ type: "acenda" }).lean();

    if (!connection) notFound();

    return <AcendaDashboard connection={serialize(connection)} />;
}
