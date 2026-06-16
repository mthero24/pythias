import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SupplierClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function SupplierPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <SupplierClient />;
}
