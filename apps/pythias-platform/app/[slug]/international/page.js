import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { I18nClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function InternationalPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <I18nClient />;
}
