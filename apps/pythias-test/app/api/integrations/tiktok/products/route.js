import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import {
    searchProductsTikTok,
    updateInventoryTikTok,
    updateProductPriceTikTok,
    getAccessTokenFromRefreshToken,
    getWarehouses,
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
    const status     = searchParams.get("status") ?? "ACTIVATE";
    const page_size  = Number(searchParams.get("page_size") ?? 20);
    if (!shopId || !shopCipher) return NextResponse.json({ error: "shopId and shopCipher required" }, { status: 400 });

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    let res = await searchProductsTikTok(credentials, shopCipher, { status, page_size });
    if (res.error && res.msg === "refresh") {
        credentials = await refreshCredentials(credentials);
        res = await searchProductsTikTok(credentials, shopCipher, { status, page_size });
    }
    if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });

    let warehouseId = null;
    try {
        credentials.shop_list = [{ shop_cipher: shopCipher }];
        const wRes = await getWarehouses(credentials);
        if (!wRes.error) warehouseId = wRes.warehouses?.find(w => w.is_default)?.id ?? wRes.warehouses?.[0]?.id ?? null;
    } catch (_) {}

    return NextResponse.json({ products: res.products, total: res.total, warehouseId });
}

export async function PUT(req) {
    const body = await req.json();
    const { shopId, shopCipher, action, productId, skus } = body;
    if (!shopId || !shopCipher || !productId || !skus) {
        return NextResponse.json({ error: "shopId, shopCipher, productId, and skus required" }, { status: 400 });
    }

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    if (action === "inventory") {
        let res = await updateInventoryTikTok(productId, skus, credentials, shopCipher);
        if (res.error && res.msg === "refresh") {
            credentials = await refreshCredentials(credentials);
            res = await updateInventoryTikTok(productId, skus, credentials, shopCipher);
        }
        if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
        return NextResponse.json({ error: false });
    }

    if (action === "price") {
        let res = await updateProductPriceTikTok(productId, skus, credentials, shopCipher);
        if (res.error && res.msg === "refresh") {
            credentials = await refreshCredentials(credentials);
            res = await updateProductPriceTikTok(productId, skus, credentials, shopCipher);
        }
        if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });
        return NextResponse.json({ error: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
