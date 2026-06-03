import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import {
    getOrdersTikTok,
    getAccessTokenFromRefreshToken,
    fulfillOrderTikTok,
    getShippingProvidersTikTok,
} from "@pythias/integrations";

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
    if (!shopId || !shopCipher) return NextResponse.json({ error: "shopId and shopCipher required" }, { status: 400 });

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    credentials.shop_cipher = shopCipher;
    let res = await getOrdersTikTok({ credentials });
    if (res.error && res.msg === "refresh") {
        credentials = await refreshCredentials(credentials);
        credentials.shop_cipher = shopCipher;
        res = await getOrdersTikTok({ credentials });
    }
    if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
    return NextResponse.json({ orders: res.orders ?? [] });
}

export async function POST(req) {
    const body = await req.json();
    const { shopId, shopCipher, action, orderId, lineItemIds, trackingNumber, shippingProviderId } = body;
    if (!shopId || !shopCipher) return NextResponse.json({ error: "shopId and shopCipher required" }, { status: 400 });

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    if (action === "providers") {
        let res = await getShippingProvidersTikTok(credentials, shopCipher);
        if (res.error && res.msg === "refresh") {
            credentials = await refreshCredentials(credentials);
            res = await getShippingProvidersTikTok(credentials, shopCipher);
        }
        if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
        return NextResponse.json({ providers: res.providers });
    }

    if (action === "ship") {
        if (!orderId || !lineItemIds?.length || !trackingNumber || !shippingProviderId) {
            return NextResponse.json({ error: "orderId, lineItemIds, trackingNumber, and shippingProviderId required" }, { status: 400 });
        }
        let res = await fulfillOrderTikTok(
            orderId,
            { line_item_ids: lineItemIds, tracking_number: trackingNumber, shipping_provider_id: shippingProviderId },
            credentials,
            shopCipher
        );
        if (res.error && res.msg === "refresh") {
            credentials = await refreshCredentials(credentials);
            res = await fulfillOrderTikTok(
                orderId,
                { line_item_ids: lineItemIds, tracking_number: trackingNumber, shipping_provider_id: shippingProviderId },
                credentials,
                shopCipher
            );
        }
        if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
        return NextResponse.json({ error: false, package_id: res.package_id });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
