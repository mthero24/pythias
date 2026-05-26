import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import { createTikTokProduct, getShops } from "@/functions/tikTok";

export async function POST(req) {
    const data = await req.json();
    console.log("TikTok route body — marketplaceName:", data.marketplaceName, "connection._id:", data.connection?._id);
    const credentials = await TikTokAuth.findById(data.connection._id);
    console.log("TikTok send — connection._id:", data.connection._id, "found:", credentials ? `${credentials.seller_name} (provider: ${credentials.provider}, has_token: ${!!credentials.access_token})` : "NOT FOUND");
    if (!credentials) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });
    if (!credentials.shop_list?.length) {
        const shops = await getShops(credentials);
        if (!shops?.length) {
            return NextResponse.json({ error: true, msg: "No TikTok shops found on this account. Make sure you have a test shop set up in TikTok Partner Center (Sandbox > Seller accounts)." }, { status: 400 });
        }
    }
    const { tiktokProductId } = await createTikTokProduct({ product: data.product, credentials, marketplaceName: data.marketplaceName });
    console.log(tiktokProductId)
    return NextResponse.json({ error: false, tiktokProductId });
}