import { ShopifyDashboard } from "@pythias/backend";

export const metadata = { title: "Shopify Sales - Premier Printing" };
export const dynamic = "force-dynamic";

export default function ShopifySalesPage() {
    return <ShopifyDashboard apiBase="/api/admin/shopify" initialTab={0} />;
}
