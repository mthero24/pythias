import { notFound } from "next/navigation";
import IntegrationDebugHub from "./IntegrationDebugHub";
export const dynamic = "force-dynamic";

// Hidden debug hub for all integrations. Reachable only at
// /admin/integrations/debug?debug=1 — returns 404 otherwise so it stays out of the way.
export default async function IntegrationDebugPage({ searchParams }) {
    const sp = await searchParams;
    if (sp?.debug !== "1") notFound();
    return <IntegrationDebugHub />;
}
