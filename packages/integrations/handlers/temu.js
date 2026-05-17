import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products } from "@pythias/mongo";
import { uploadImageTemu, addProductTemu, getOrdersTemu, shipOrderTemu } from "../functions/temu.js";

export async function handleTemuSendPOST(req) {
    const body = await req.json();
    const { connectionId } = body;
    const productId = body.productId ?? body.product?._id;

    if (!productId || !connectionId) {
        return NextResponse.json({ error: "productId and connectionId are required" }, { status: 400 });
    }

    const [connection, product] = await Promise.all([
        ApiKeyIntegrations.findById(connectionId).lean(),
        Products.findById(productId).populate("blanks").populate("variantsArray.color").lean(),
    ]);

    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    if (!product)    return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const appKey      = connection.apiKey;
    const appSecret   = connection.apiSecret;
    const accessToken = connection.refreshToken;

    if (!appKey || !appSecret || !accessToken) {
        return NextResponse.json({ error: "Connection missing appKey, appSecret, or accessToken" }, { status: 400 });
    }

    const blank = product.blanks?.[0] ?? null;

    const blankOverrides = blank?.marketPlaceOverrides?.[connection.displayName]
        ?? blank?.marketPlaceOverrides?.["TEMU"]
        ?? blank?.marketPlaceOverrides?.["temu"]
        ?? {};

    const SKIP_KEYS = new Set(["titleGenerator"]);
    const productOverrides = Object.fromEntries(
        Object.entries(
            product.marketplaceValues?.[connectionId]
            ?? product.marketplaceValues?.[String(connectionId)]
            ?? {}
        ).filter(([k, v]) => !SKIP_KEYS.has(k) && v !== "" && v != null)
    );

    const catId = Number(blankOverrides.catId ?? blankOverrides.cat_id ?? productOverrides.catId ?? productOverrides.cat_id ?? 0);
    if (!catId) {
        return NextResponse.json({ error: "catId is required — set it in blankOverrides or productOverrides" }, { status: 400 });
    }

    const costTemplateId   = Number(connection.organization || blankOverrides.costTemplateId || productOverrides.costTemplateId || 0);
    const shipmentLimitDay = Number(blankOverrides.shipmentLimitDay ?? productOverrides.shipmentLimitDay ?? 5);

    const colorParentSpecId = Number(blankOverrides.color_parent_spec_id ?? productOverrides.color_parent_spec_id ?? 0);
    const sizeParentSpecId  = Number(blankOverrides.size_parent_spec_id  ?? productOverrides.size_parent_spec_id  ?? 0);
    const colorValues       = blankOverrides.color_values ?? productOverrides.color_values ?? {};
    const sizeValues        = blankOverrides.size_values  ?? productOverrides.size_values  ?? {};

    const defWeight = Number(blankOverrides.weight ?? productOverrides.weight ?? 200);
    const defLength = Number(blankOverrides.length ?? productOverrides.length ?? 30);
    const defWidth  = Number(blankOverrides.width  ?? productOverrides.width  ?? 20);
    const defHeight = Number(blankOverrides.height ?? productOverrides.height ?? 5);

    const validVariants = (product.variantsArray ?? []).filter(v => v.sku);
    if (validVariants.length === 0) {
        return NextResponse.json({ error: "No variants with SKU" }, { status: 400 });
    }

    const title   = String(productOverrides.name ?? product.title ?? product.name ?? "").trim() || "Product";
    const rawDesc = String(productOverrides.description ?? product.description ?? title);
    const description = rawDesc.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).join(" ").slice(0, 500) || title;

    const productImageUrls = (product.productImages ?? [])
        .map(i => i.image)
        .filter(u => typeof u === "string" && u.startsWith("http"))
        .slice(0, 8);

    const uploadedImages = [];
    for (const url of productImageUrls) {
        const uploaded = await uploadImageTemu({ appKey, appSecret, accessToken, fileUrl: url });
        if (uploaded) uploadedImages.push(uploaded);
    }

    const skuList = [];
    for (const v of validVariants) {
        const colorName = v.color?.name?.trim() || "";
        const sizeObj   = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size));
        const sizeName  = sizeObj?.name?.trim() || "";

        const specDetails = [];
        if (colorName) {
            const colorSpecId = Number(colorValues[colorName] ?? 0);
            specDetails.push({
                ...(colorSpecId        ? { specId: colorSpecId }            : {}),
                ...(colorParentSpecId  ? { parentSpecId: colorParentSpecId } : {}),
                specName: colorName,
            });
        }
        if (sizeName) {
            const sizeSpecId = Number(sizeValues[sizeName] ?? 0);
            specDetails.push({
                ...(sizeSpecId        ? { specId: sizeSpecId }             : {}),
                ...(sizeParentSpecId  ? { parentSpecId: sizeParentSpecId } : {}),
                specName: sizeName,
            });
        }

        const retailPrice = Number(v.price ?? sizeObj?.retailPrice ?? 0);
        const priceCents  = retailPrice > 0 ? Math.round(retailPrice * 100) : 999;

        const sku = {
            outSkuSn: String(v.sku).slice(0, 40),
            price: priceCents,
            quantity: 9999,
            weight: defWeight,
            packageLength: defLength,
            packageWidth: defWidth,
            packageHeight: defHeight,
        };
        if (specDetails.length > 0) sku.specDetails = specDetails;
        skuList.push(sku);
    }

    const existingGoodsId = product.ids?.[connection.displayName];

    const payload = {
        outGoodsSn: String(productId).slice(-100),
        goodsBasic: { goodsName: title.slice(0, 500), catId },
        ...(costTemplateId ? { goodsServicePromise: { costTemplateId, shipmentLimitDay } } : {}),
        skuList,
        ...(uploadedImages.length > 0 ? { mainImageList: uploadedImages.map(u => ({ imageUrl: u })) } : {}),
        ...(existingGoodsId ? { goodsId: existingGoodsId } : {}),
    };

    const result = await addProductTemu({ appKey, appSecret, accessToken, payload });

    if (result.error) {
        return NextResponse.json({ error: result.error, sentPayload: payload }, { status: 502 });
    }

    return NextResponse.json({ success: true, goodsId: result.goodsId, product: result.result });
}

export async function handleTemuOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getOrdersTemu({
        appKey:      connection.apiKey,
        appSecret:   connection.apiSecret,
        accessToken: connection.refreshToken,
        orderStatus: Number(searchParams.get("orderStatus") ?? 1),
        pageNo:      Number(searchParams.get("pageNo")      ?? 1),
        pageSize:    Number(searchParams.get("pageSize")    ?? 50),
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleTemuOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderSn, action, carrierCode, trackingNumber } = body;

    if (!connectionId || !orderSn || !action) {
        return NextResponse.json({ error: "connectionId, orderSn, and action are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    if (action === "ship") {
        if (!carrierCode || !trackingNumber) {
            return NextResponse.json({ error: "carrierCode and trackingNumber are required" }, { status: 400 });
        }
        const result = await shipOrderTemu({
            appKey:      connection.apiKey,
            appSecret:   connection.apiSecret,
            accessToken: connection.refreshToken,
            orderSn, carrierCode, trackingNumber,
        });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action "${action}". Valid: ship` }, { status: 400 });
}
