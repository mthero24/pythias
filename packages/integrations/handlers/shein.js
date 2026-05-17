import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products } from "@pythias/mongo";
import { sheinRequest, convertImageShein, getOrdersShein, shipOrderShein } from "../functions/shein.js";

export async function handleSheinSendPOST(req) {
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

    const openKeyId = connection.apiKey;
    const secretKey = connection.apiSecret;

    if (!openKeyId || !secretKey) {
        return NextResponse.json({ error: "Connection missing openKeyId or secretKey" }, { status: 400 });
    }

    const blank = product.blanks?.[0] ?? null;

    const blankOverrides = blank?.marketPlaceOverrides?.[connection.displayName]
        ?? blank?.marketPlaceOverrides?.["SHEIN"]
        ?? blank?.marketPlaceOverrides?.["shein"]
        ?? {};

    const SKIP_KEYS = new Set(["titleGenerator"]);
    const productOverrides = Object.fromEntries(
        Object.entries(
            product.marketplaceValues?.[connectionId]
            ?? product.marketplaceValues?.[String(connectionId)]
            ?? {}
        ).filter(([k, v]) => !SKIP_KEYS.has(k) && v !== "" && v != null)
    );

    const resolvedCategoryId = Number(connection.organization || blankOverrides.category_id || productOverrides.category_id || 0);
    if (!resolvedCategoryId) {
        return NextResponse.json({ error: "category_id is required — set it on the connection or in blankOverrides" }, { status: 400 });
    }

    const colorAttrId  = Number(blankOverrides.color_attr_id  ?? productOverrides.color_attr_id  ?? 6);
    const sizeAttrId   = Number(blankOverrides.size_attr_id   ?? productOverrides.size_attr_id   ?? 14);
    const colorValues  = blankOverrides.color_values  ?? productOverrides.color_values  ?? {};
    const sizeValues   = blankOverrides.size_values   ?? productOverrides.size_values   ?? {};
    const site         = blankOverrides.site          ?? productOverrides.site          ?? "us";
    const currency     = blankOverrides.currency      ?? productOverrides.currency      ?? "USD";
    const warehouse    = String(blankOverrides.warehouse ?? productOverrides.warehouse ?? "");
    const defWeight    = Number(blankOverrides.weight  ?? productOverrides.weight  ?? 200);
    const defHeight    = String(blankOverrides.height  ?? productOverrides.height  ?? "5");
    const defLength    = String(blankOverrides.length  ?? productOverrides.length  ?? "30");
    const defWidth     = String(blankOverrides.width   ?? productOverrides.width   ?? "20");

    const validVariants = (product.variantsArray ?? []).filter(v => v.sku);
    if (validVariants.length === 0) {
        return NextResponse.json({ error: "No variants with SKU" }, { status: 400 });
    }

    const title   = String(productOverrides.name ?? product.title ?? product.name ?? "").trim() || "Product";
    const rawDesc = String(productOverrides.description ?? product.description ?? title);
    const description = rawDesc.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).join(" ").slice(0, 5000) || title;

    const productImageUrls = (product.productImages ?? [])
        .map(i => i.image)
        .filter(u => typeof u === "string" && u.startsWith("http"))
        .slice(0, 8);

    const convertedProductImages = [];
    for (const url of productImageUrls) {
        const converted = await convertImageShein({ openKeyId, secretKey, url });
        if (converted) convertedProductImages.push(converted);
    }

    const colorGroups = new Map();
    for (const v of validVariants) {
        const colorName = v.color?.name?.trim() || "Default";
        if (!colorGroups.has(colorName)) colorGroups.set(colorName, []);
        colorGroups.get(colorName).push(v);
    }

    const skcList = [];
    for (const [colorName, variants] of colorGroups) {
        const colorValueId = Number(colorValues[colorName] ?? 0);

        const colorImgUrl = variants.find(v => typeof v.image === "string" && v.image.startsWith("http"))?.image
            ?? productImageUrls[0];
        const convertedColorImg = colorImgUrl ? await convertImageShein({ openKeyId, secretKey, url: colorImgUrl }) : null;

        const imageUrlList = convertedColorImg
            ? [{ image_url: convertedColorImg }]
            : convertedProductImages.slice(0, 1).map(u => ({ image_url: u }));

        const skuList = [];
        for (const v of variants) {
            const sizeObj = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size));
            const sizeName = sizeObj?.name?.trim() || "";
            const sizeValueId = Number(sizeValues[sizeName] ?? 0);

            const retailPrice = Number(v.price ?? sizeObj?.retailPrice ?? 0);
            const price = retailPrice > 0 ? retailPrice.toFixed(2) : "9.99";

            const skuSaleAttrs = [];
            if (colorValueId) skuSaleAttrs.push({ attr_id: colorAttrId, attr_value_id: colorValueId });
            if (sizeValueId)  skuSaleAttrs.push({ attr_id: sizeAttrId,  attr_value_id: sizeValueId });

            const sku = {
                supplier_sku: String(v.sku),
                mall_state: 1,
                price_info_list: [{ site, price, original_price: price, currency }],
                stock_info_list: [{
                    site,
                    stock_info: [warehouse
                        ? { warehouse, stock_quantity: 9999 }
                        : { stock_quantity: 9999 }
                    ],
                }],
                weight: defWeight,
                height: defHeight,
                length: defLength,
                width: defWidth,
                package_size_unit: "cm",
                weight_unit: "g",
            };
            if (skuSaleAttrs.length > 0) sku.sale_attribute = skuSaleAttrs;
            skuList.push(sku);
        }

        const productIdSuffix = String(productId).slice(-8);
        const skc = {
            supplier_code: `${productIdSuffix}-${colorName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 20)}`,
            image_info: { image_url_list: imageUrlList.length > 0 ? imageUrlList : [{ image_url: "" }] },
            sku_list: skuList,
        };
        if (colorValueId) skc.sale_attribute = [{ attr_id: colorAttrId, attr_value_id: colorValueId }];
        skcList.push(skc);
    }

    const existingSpuName = product.ids?.[connection.displayName]
        ?? product.marketplaceValues?.[connectionId]?.sheinSpuName
        ?? product.marketplaceValues?.[String(connectionId)]?.sheinSpuName;

    const payload = {
        category_id: resolvedCategoryId,
        name: title,
        description,
        skc_list: skcList,
        ...(convertedProductImages.length > 0
            ? { main_image_list: convertedProductImages.map(u => ({ image_url: u })) }
            : {}),
        ...(existingSpuName ? { spu_name: existingSpuName } : {}),
    };

    const result = await sheinRequest({
        openKeyId, secretKey,
        path: "/open-api/goods/product/publishOrEdit",
        data: payload,
    });

    if (result.error || result.data?.code !== "0") {
        return NextResponse.json({ error: result.error ?? result.data, sentPayload: payload }, { status: 502 });
    }

    const sheinProduct = result.data?.data;
    const spuName = sheinProduct?.spu_name ?? sheinProduct?.spu_id ?? existingSpuName;

    return NextResponse.json({ success: true, sheinSpuName: spuName, product: sheinProduct });
}

export async function handleSheinOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getOrdersShein({
        openKeyId: connection.apiKey,
        secretKey: connection.apiSecret,
        status:   searchParams.get("status")   ?? "unshipped",
        page:     Number(searchParams.get("page")     ?? 1),
        pageSize: Number(searchParams.get("pageSize") ?? 50),
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleSheinOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, action, carrierCode, trackingNumber } = body;

    if (!connectionId || !orderId || !action) {
        return NextResponse.json({ error: "connectionId, orderId, and action are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    if (action === "ship") {
        if (!carrierCode || !trackingNumber) {
            return NextResponse.json({ error: "carrierCode and trackingNumber are required" }, { status: 400 });
        }
        const result = await shipOrderShein({
            openKeyId: connection.apiKey,
            secretKey: connection.apiSecret,
            orderId, carrierCode, trackingNumber,
        });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action "${action}". Valid: ship` }, { status: 400 });
}
