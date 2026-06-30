import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import {
    getOrdersTikTok,
    getAccessTokenFromRefreshToken,
    createPackageTikTok,
    shipPackageTikTok,
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
        if (!orderId || !trackingNumber || !shippingProviderId) {
            return NextResponse.json({ error: "orderId, trackingNumber, and shippingProviderId required" }, { status: 400 });
        }
        // TikTok 202309: create the package for the line items, then ship it with tracking.
        const doShip = async () => {
            const created = await createPackageTikTok(orderId, lineItemIds || [], credentials, shopCipher);
            if (created.error) return created;
            if (!created.package_id) return { error: true, msg: "No TikTok package id returned" };
            return shipPackageTikTok(created.package_id, { tracking_number: trackingNumber, shipping_provider_id: shippingProviderId }, credentials, shopCipher);
        };
        let res = await doShip();
        if (res.error && res.msg === "refresh") {
            credentials = await refreshCredentials(credentials);
            res = await doShip();
        }
        if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
        return NextResponse.json({ error: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
