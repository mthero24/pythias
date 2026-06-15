import { StorefrontEditor } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Premier's own storefront — same shared builder the platform mounts (Commerce Cloud).
export default function PremierStorePage() {
    const base = process.env.STOREFRONT_PUBLIC_BASE || "pythias.store";
    return <StorefrontEditor viewUrl={`https://premier-printing.${base}`} />;
}
