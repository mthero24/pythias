import { DesignTemplate } from "@pythias/mongo";
import { DesignTemplatesList } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default async function DesignTemplatesPage() {
  const templates = await DesignTemplate.find({})
    .select("name active customizableFields canvasJson printType createdAt updatedAt")
    .sort({ _id: -1 })
    .lean();

  return <DesignTemplatesList templates={JSON.parse(JSON.stringify(templates))} />;
}
