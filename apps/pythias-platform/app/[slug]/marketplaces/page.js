import { PlatformMarketPlace } from "@pythias/mongo";
import { MarketplacesMain, serialize } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const metadata = {
    title: 'Marketplaces',
};
export const dynamic = 'force-dynamic';
export default async function MarketplacesPage() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    let marketplaces = await PlatformMarketPlace.find({ orgId }).lean();
    marketplaces = serialize(marketplaces);
    return <MarketplacesMain marketplaces={marketplaces} />;
}