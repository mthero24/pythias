import { ShopifyDashboard } from "@pythias/backend";

export const metadata = { title: "Shopify Dashboard - Print Threads" };
export const dynamic = "force-dynamic";

export default function ShopifyPage() {
    return <ShopifyDashboard apiBase="/api/admin/shopify" />;
}
