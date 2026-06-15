import { SeoPagesClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default function PremierSeoPagesPage() {
    const base = process.env.STOREFRONT_PUBLIC_BASE || "pythias.store";
    return <SeoPagesClient viewBase={`https://premier-printing.${base}`} />;
}
