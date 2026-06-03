import { PlatformDesignTemplate } from "@pythias/mongo";
import { DesignTemplatesList } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DesignTemplatesPage() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;

    const templates = await PlatformDesignTemplate.find({ orgId })
        .select("name active customizableFields canvasJson printType createdAt updatedAt")
        .sort({ _id: -1 })
        .lean();

    return <DesignTemplatesList templates={JSON.parse(JSON.stringify(templates))} />;
}
