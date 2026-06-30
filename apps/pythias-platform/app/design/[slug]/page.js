import { DesignStudio } from "@pythias/backend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Design & Send In" };

// Public customer-facing studio scoped to a shop by slug. Platform middleware allowlists design/.
export default async function DesignPage({ params }) {
    const { slug } = await params;
    return <DesignStudio orgSlug={slug} />;
}
