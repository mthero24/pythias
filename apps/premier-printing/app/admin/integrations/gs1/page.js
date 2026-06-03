import { Gs1Dashboard } from "@pythias/integrations";
export const dynamic = "force-dynamic";

export default function Gs1Page() {
    return <Gs1Dashboard backHref="/admin/integrations" />;
}
