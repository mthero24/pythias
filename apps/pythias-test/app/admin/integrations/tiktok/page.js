import { notFound } from "next/navigation";
import { TikTokAuth } from "@pythias/mongo";
import { TikTokDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function TikTokPage() {
    const shops = await TikTokAuth.find({ provider: "pythias-test" }).sort({ date: -1 }).lean().catch(() => []);
    if (!shops.length) notFound();
    return <TikTokDashboard shops={serialize(shops)} />;
}
