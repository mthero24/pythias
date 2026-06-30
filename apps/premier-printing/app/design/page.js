import { DesignStudio } from "@pythias/backend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Design & Send In" };

// Public customer-facing studio (single-tenant — no orgSlug). Premier middleware allowlists /design.
export default function DesignPage() {
    return <DesignStudio />;
}
