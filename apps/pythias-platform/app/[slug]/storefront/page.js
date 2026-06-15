import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Organization } from "@pythias/mongo";
import { StorefrontEditor } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

// Mounts the shared storefront builder in the platform (Commerce Cloud sellers).
// The same component will be dropped into premier-printing later.
export default async function StorefrontPage() {
    const session = await getServerSession(authOptions);
    const org = session?.user?.orgId ? await Organization.findById(session.user.orgId).select("slug").lean() : null;
    const base = process.env.STOREFRONT_PUBLIC_BASE || "pythias.store";
    const viewUrl = org?.slug ? `https://${org.slug}.${base}` : undefined;

    return <StorefrontEditor viewUrl={viewUrl} />;
}
