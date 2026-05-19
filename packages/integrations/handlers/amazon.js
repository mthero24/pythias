import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products, Blank } from "@pythias/mongo";
import {
    getAmazonAccessToken,
    getOrdersAmazon,
    getOrderItemsAmazon,
    confirmShipmentAmazon,
    createListingAmazon,
    getCatalogItemsAmazon,
} from "../functions/amazon.js";

export async function handleAmazonTestPOST(req) {
    const { clientId, clientSecret, refreshToken } = await req.json();
    if (!clientId || !clientSecret || !refreshToken) {
        return NextResponse.json({ ok: false, error: "clientId, clientSecret, and refreshToken required" }, { status: 400 });
    }
    const result = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (result.error) return NextResponse.json({ ok: false, error: result.error });
    return NextResponse.json({ ok: true });
}

export async function handleAmazonGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getCatalogItemsAmazon({
        clientId:        connection.apiKey,
        clientSecret:    connection.apiSecret,
        refreshToken:    connection.refreshToken,
        sellerId:        connection.organization,
        marketplaceId:   connection.shopId,
        keywords:        searchParams.get("keywords") || undefined,
        identifiers:     searchParams.get("identifiers") || undefined,
        identifiersType: searchParams.get("identifiersType") || undefined,
        pageToken:       searchParams.get("pageToken") || undefined,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleAmazonOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = {
        clientId:      connection.apiKey,
        clientSecret:  connection.apiSecret,
        refreshToken:  connection.refreshToken,
        marketplaceId: connection.shopId,
    };

    const result = await getOrdersAmazon({
        ...creds,
        createdAfter: searchParams.get("createdAfter") || undefined,
        nextToken:    searchParams.get("nextToken") || undefined,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });

    const orders = await Promise.all((result.orders ?? []).map(async order => {
        const itemsResult = await getOrderItemsAmazon({ ...creds, orderId: order.AmazonOrderId });
        return { ...order, orderItems: itemsResult.orderItems ?? [] };
    }));

    return NextResponse.json({ orders, nextToken: result.nextToken });
}

export async function handleAmazonOrdersPOST(req) {
    const { connectionId, orderId, action, trackingNumber, carrier, orderItems } = await req.json();
    if (!connectionId || !orderId || !action) {
        return NextResponse.json({ error: "connectionId, orderId, and action required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    if (action === "ship") {
        if (!trackingNumber || !carrier || !orderItems?.length) {
            return NextResponse.json({ error: "trackingNumber, carrier, and orderItems required" }, { status: 400 });
        }
        const result = await confirmShipmentAmazon({
            clientId:      connection.apiKey,
            clientSecret:  connection.apiSecret,
            refreshToken:  connection.refreshToken,
            orderId,
            marketplaceId: connection.shopId,
            packageDetail: {
                packageReferenceId: "1",
                carrierCode:        carrier,
                trackingNumber,
                shipDate:           new Date().toISOString(),
                orderItems:         orderItems.map(i => ({ orderItemId: i.orderItemId, quantity: i.quantity })),
            },
        });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function handleAmazonSendPOST(req) {
    const { connectionId, productId } = await req.json();
    if (!connectionId || !productId) {
        return NextResponse.json({ error: "connectionId and productId required" }, { status: 400 });
    }

    const [connection, product] = await Promise.all([
        ApiKeyIntegrations.findById(connectionId).lean(),
        Products.findById(productId).populate("blanks").populate("variantsArray.color").lean(),
    ]);

    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    if (!product)    return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const blank = product.blanks?.[0] ?? null;
    const validVariants = (product.variantsArray ?? []).filter(v => v.sku);
    if (!validVariants.length) return NextResponse.json({ error: "No variants with SKU" }, { status: 400 });

    const results = [];
    for (const variant of validVariants) {
        const sizeObj   = blank?.sizes?.find(s => s._id?.toString() === String(variant.size));
        const price     = String(Number(variant.price ?? sizeObj?.retailPrice ?? 0).toFixed(2));
        const colorName = variant.color?.name ?? "Default";
        const sizeName  = sizeObj?.name ?? "One Size";

        const bulletPoints = (blank?.bulletPoints ?? []).slice(0, 5)
            .map(bp => ({ value: `${bp.title}: ${bp.description}`, language_tag: "en_US" }));

        const attributes = {
            item_name:   [{ value: `${product.title} - ${colorName} - ${sizeName}`, language_tag: "en_US" }],
            brand:       [{ value: product.brand || "Simply Sage Market" }],
            list_price:  [{ value: price, currency: "USD" }],
            color:       [{ value: colorName }],
            size:        [{ value: sizeName }],
            description: [{ value: (product.description ?? product.title ?? "").replace(/<[^>]+>/g, " ").slice(0, 2000), language_tag: "en_US" }],
            ...(bulletPoints.length ? { bullet_point: bulletPoints } : {}),
            ...(variant.image ? { main_product_image_locator: [{ media_location: variant.image }] } : {}),
        };

        const result = await createListingAmazon({
            clientId:      connection.apiKey,
            clientSecret:  connection.apiSecret,
            refreshToken:  connection.refreshToken,
            sellerId:      connection.organization,
            marketplaceId: connection.shopId,
            sku:           variant.sku,
            productType:   "SHIRT",
            attributes,
        });

        results.push({ sku: variant.sku, ...result });
    }

    const errors = results.filter(r => r.error);
    if (errors.length === results.length) return NextResponse.json({ error: "All variants failed", results }, { status: 502 });
    return NextResponse.json({ results, errors: errors.length });
}
