import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { StoresClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function StoresPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    const { slug } = await params;
    return <StoresClient editBase={`/${slug}/storefront`} enableDomains />;
}
