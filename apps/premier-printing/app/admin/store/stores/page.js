import { StoresClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default function PremierStoresPage() {
    return <StoresClient editBase="/admin/store" />;
}
