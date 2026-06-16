import { notFound } from "next/navigation";
import IntegrationDebugHub from "./IntegrationDebugHub";
export const dynamic = "force-dynamic";

// Hidden per-org debug hub. Reachable only at
// /<slug>/admin/integrations/debug?debug=1 — 404 otherwise.
export default async function IntegrationDebugPage({ searchParams }) {
    const sp = await searchParams;
    if (sp?.debug !== "1") notFound();
    return <IntegrationDebugHub />;
}
