import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { QuotesClient } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default async function QuotesPage(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    const { slug } = await req.params;
    return <QuotesClient base={`/${slug}`} />;
}
