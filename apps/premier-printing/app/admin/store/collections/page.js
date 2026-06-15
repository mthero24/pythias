import { CollectionsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default function PremierCollectionsPage() {
    const base = process.env.STOREFRONT_PUBLIC_BASE || "pythias.store";
    return <CollectionsClient viewBase={`https://premier-printing.${base}`} />;
}
