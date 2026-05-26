import { notFound } from "next/navigation";
import { TikTokAuth } from "@pythias/mongo";
import { TikTokDashboard } from "@pythias/integrations";
import { getShops } from "@/functions/tikTok";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export default async function TikTokPage() {
    const auths = await TikTokAuth.find({ provider: "printthreads" }).sort({ date: -1 }).catch(() => []);
    if (!auths.length) notFound();

    // For any auth missing shops, fetch and persist them now
    await Promise.all(auths.map(async (auth) => {
        if (!auth.shop_list?.length) {
            await getShops(auth);
        }
    }));

    // Re-fetch with updated shop_list
    const shops = await TikTokAuth.find({ provider: "printthreads" }).sort({ date: -1 }).lean().catch(() => []);
    return <TikTokDashboard shops={serialize(shops)} />;
}
