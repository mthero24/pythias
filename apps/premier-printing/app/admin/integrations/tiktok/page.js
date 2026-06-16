import { notFound } from "next/navigation";
import { TikTokAuth } from "@pythias/mongo";
import { TikTokDashboard } from "@pythias/integrations";
import { serialize } from "@/functions/serialize";
import TikTokPullTest from "./TikTokPullTest";
export const dynamic = "force-dynamic";

export default async function TikTokPage({ searchParams }) {
    const shops = await TikTokAuth.find({ provider: "premierPrinting" }).sort({ date: -1 }).lean().catch(() => []);
    if (!shops.length) notFound();
    // Debug pull widget is hidden by default — append ?debug=1 to the URL to show it.
    const sp = await searchParams;
    const showDebug = sp?.debug === "1";
    return (
        <>
            {showDebug && <TikTokPullTest />}
            <TikTokDashboard shops={serialize(shops)} />
        </>
    );
}
