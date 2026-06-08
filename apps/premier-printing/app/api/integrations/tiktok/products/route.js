import { NextResponse } from "next/server";
import { TikTokAuth, Products } from "@pythias/mongo";
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
    const status          = searchParams.get("status") ?? "ACTIVATE";
    const page_size       = Number(searchParams.get("page_size") ?? 50);
    const page_token      = searchParams.get("page_token") || null;
    const sku             = searchParams.get("sku") || null;
    if (!shopId || !shopCipher) return NextResponse.json({ error: "shopId and shopCipher required" }, { status: 400 });

    let credentials = await TikTokAuth.findById(shopId);
    if (!credentials) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const searchOpts = { status, page_size, page_token, ...(sku ? { seller_skus: [sku] } : {}) };
    let res = await searchProductsTikTok(credentials, shopCipher, searchOpts);
    if (res.error && res.msg === "refresh") {
        credentials = await refreshCredentials(credentials);
        res = await searchProductsTikTok(credentials, shopCipher, searchOpts);
    }
    if (res.error) return NextResponse.json({ error: res.msg }, { status: 500 });

    // Fetch warehouse id for inventory updates
    let warehouseId = null;
    try {
        credentials.shop_list = [{ shop_cipher: shopCipher }];
        const wRes = await getWarehouses(credentials);
        if (!wRes.error) warehouseId = wRes.warehouses?.find(w => w.is_default)?.id ?? wRes.warehouses?.[0]?.id ?? null;
    } catch (_) {}

    // Enrich with a static blank image from the database (variantsArray.image is the pre-rendered URL)
    const sellerSkus = res.products.map(p => p.skus?.[0]?.seller_sku).filter(Boolean);
    const dbProducts = sellerSkus.length
        ? await Products.find({ "variantsArray.sku": { $in: sellerSkus } })
            .select("variantsArray.sku variantsArray.image")
            .lean()
        : [];
    const skuToImage = {};
    for (const dbp of dbProducts) {
        for (const v of dbp.variantsArray ?? []) {
            if (v.sku && v.image) skuToImage[v.sku] = v.image;
        }
    }
    const products = res.products.map(p => {
        const sku = p.skus?.[0]?.seller_sku;
        return sku && skuToImage[sku] ? { ...p, _dbImage: skuToImage[sku] } : p;
    });

    return NextResponse.json({ products, total: res.total, next_page_token: res.next_page_token ?? null, warehouseId });
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
