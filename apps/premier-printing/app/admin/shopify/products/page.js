import { ShopifyDashboard } from "@pythias/backend";

export const metadata = { title: "Shopify Products - Premier Printing" };
export const dynamic = "force-dynamic";

export default function ShopifyProductsPage() {
    return <ShopifyDashboard apiBase="/api/admin/shopify" initialTab={1} />;
}
