import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import { getProductAnalyticsTikTok, getAccessTokenFromRefreshToken } from "@pythias/integrations";

async function refreshCredentials(credentials) {
    const tokens = await getAccessTokenFromRefreshToken(credentials.refresh_token);
    for (const key of Object.keys(tokens)) credentials[key] = tokens[key];
    credentials.date = new Date();
    return credentials.save();
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const shopId     = searchParams.get("shopId");
    const shopCipher = searchParams.get("shopCipher");
    const productId  = searchParams.get("productId");
    const days       = parseInt(searchParams.get("days") ?? "30");
    if (!shopId || !shopCipher || !productId) {
        return NextResponse.json({ error: "shopId, shopCipher, and productId required" }, { status: 400 });
    }

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    let res = await getProductAnalyticsTikTok(productId, credentials, shopCipher, { days });
    if (res.error && res.msg === "refresh") {
        credentials = await refreshCredentials(credentials);
        res = await getProductAnalyticsTikTok(productId, credentials, shopCipher, { days });
    }
    if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });

    return NextResponse.json({ analytics: res.analytics });
}
