import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { TikTokAuth } from "@pythias/mongo";
import { TikTokDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function TikTokPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const shops = await TikTokAuth.find({ provider: slug }).sort({ date: -1 }).lean().catch(() => []);
    return <TikTokDashboard shops={serialize(shops)} slug={slug} />;
}
