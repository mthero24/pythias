import {MarketPlaces} from '@pythias/mongo';
import { MarketplacesMain, serialize } from "@pythias/backend";

export const metadata = {
    title: 'Marketplaces - Premier Printing',
};
export const dynamic = 'force-dynamic';
export default async function handler(req, res) {
    let marketplaces = await MarketPlaces.find().lean();
    marketplaces = serialize(marketplaces);
    return <MarketplacesMain marketplaces={marketplaces} />;
}