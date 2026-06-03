import { Gs1Dashboard } from "@pythias/integrations";
export const dynamic = "force-dynamic";

export default async function Gs1Page({ params }) {
    const { slug } = await params;
    return <Gs1Dashboard backHref={`/${slug}/admin/integrations`} />;
}
