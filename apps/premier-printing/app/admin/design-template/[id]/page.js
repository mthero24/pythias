import { DesignTemplateEditor } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default function DesignTemplatePage({ params }) {
  return (
    <DesignTemplateEditor
      templateId={params.id}
      apiBase="/api/admin/design-templates"
    />
  );
}
