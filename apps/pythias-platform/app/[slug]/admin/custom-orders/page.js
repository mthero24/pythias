import { CustomOrdersList } from "@pythias/backend";

export const metadata = { title: "Custom Orders" };

export const dynamic = "force-dynamic";

export default function CustomOrdersPage() {
    return <CustomOrdersList />;
}
