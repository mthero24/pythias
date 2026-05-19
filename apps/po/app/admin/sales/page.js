import { ShopifySalesPage } from "@pythias/backend";

export const metadata = { title: "Sales - Print Oracle" };
export const dynamic = "force-dynamic";

export default function SalesPage() {
    return <ShopifySalesPage apiBase="/api/admin/shopify" />;
}
