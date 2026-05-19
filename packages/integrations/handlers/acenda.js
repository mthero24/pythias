import { NextResponse } from "next/server";
import { Products, SkuToUpc, ApiKeyIntegrations } from "@pythias/mongo";
import {
    getSkuAcenda, addInventoryAcenda, getShipAdviceAcenda, acknowledgeShipAdviceAcenda,
    fulfillShipAdviceAcenda, getSalesChannelsAcenda, getInventoryDetailAcenda,
    getWarehouseAcenda, getCatalogAcenda,
} from "../functions/acenda.js";

export async function handleAcendaPOST(req) {
    const body = await req.json();
    let product = await Products.findOne({ _id: body.product._id }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    let acendaProductSku;
    for (let variant of product.variantsArray) {
        if (!variant.ids) variant.ids = {};
        if (!variant.ids["acenda"]) {
            let res = await getSkuAcenda({ sku: variant.sku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
            if (res && res[0] && res[0].id) {
                variant.ids["acenda"] = res[0].id;
                acendaProductSku = res[0].group_skus ? res[0].group_skus[0] : undefined;
            } else {
                let skuToUpc = await SkuToUpc.findOne({ sku: variant.sku });
                if (skuToUpc && skuToUpc.upc) {
                    if (skuToUpc && skuToUpc.previousSkus && skuToUpc.previousSkus.length > 0) {
                        for (let previousSku of skuToUpc.previousSkus) {
                            let res = await getSkuAcenda({ sku: previousSku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
                            if (res && res[0] && res[0].id) {
                                if (!variant.ids) variant.ids = {};
                                variant.ids["acenda"] = res[0].id;
                                acendaProductSku = res[0].group_skus ? res[0].group_skus[0] : undefined;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    if (!product.ids) product.ids = {};
    if (!product.ids["acenda"]) {
        let acendaProduct = await getSkuAcenda({ sku: product.sku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
        if (acendaProductSku && (!acendaProduct || !acendaProduct[0] || !acendaProduct[0].id)) {
            acendaProduct = await getSkuAcenda({ sku: acendaProductSku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
        }
        if (acendaProduct && acendaProduct[0] && acendaProduct[0].id) {
            product.ids["acenda"] = acendaProduct[0].id;
        }
    }
    product.markModified("variantsArray ids");
    product = await product.save();
    return NextResponse.json({ error: false, product }, { status: 200 });
}

export async function handleAcendaGET(req) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const prods = searchParams.get("prods");
    const connectionId = searchParams.get("connectionId");
    const product = await Products.findOne({ _id: productId }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    const products = await Products.find({ _id: { $in: prods.split(",") } }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    const connection = await ApiKeyIntegrations.findOne({ _id: connectionId });
    if (products && products.length > 0) {
        for (let prod of products) {
            let inventory = [];
            for (let variant of prod.variantsArray) {
                inventory.push({ quantity: 1000, sku: variant.sku, tracking: "basic", warehouse_id: 1 });
            }
            await addInventoryAcenda({ clientId: connection.apiKey, clientSecret: connection.apiSecret, organization: connection.organization, inventory });
        }
        return NextResponse.json({ error: false, products }, { status: 200 });
    }
    if (!product || !connection) {
        return NextResponse.json({ error: true, message: "Product not found" }, { status: 404 });
    } else {
        let inventory = [];
        for (let variant of product.variantsArray) {
            inventory.push({ quantity: 1000, sku: variant.sku, tracking: "basic", warehouse_id: 1 });
        }
        await addInventoryAcenda({ clientId: connection.apiKey, clientSecret: connection.apiSecret, organization: connection.organization, inventory });
        return NextResponse.json({ error: false, product }, { status: 200 });
    }
}

export async function handleAcendaOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const unacked = searchParams.get("unacked") !== "false";
    const limit   = Number(searchParams.get("limit")  ?? 50);
    const offset  = Number(searchParams.get("offset") ?? 0);

    const result = await getShipAdviceAcenda({
        clientId: connection.apiKey, clientSecret: connection.apiSecret,
        organization: connection.organization, unacked, limit, offset,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ orders: result.orders, total: result.total });
}

export async function handleAcendaOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, action, carrier, trackingNumber } = body;
    if (!connectionId || !orderId) {
        return NextResponse.json({ error: "connectionId and orderId are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    if (action === "fulfill") {
        if (!carrier || !trackingNumber) {
            return NextResponse.json({ error: "carrier and trackingNumber are required for fulfill" }, { status: 400 });
        }
        const result = await fulfillShipAdviceAcenda({
            clientId: connection.apiKey, clientSecret: connection.apiSecret,
            organization: connection.organization, id: orderId, carrier, trackingNumber,
        });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true });
    }

    const result = await acknowledgeShipAdviceAcenda({
        clientId: connection.apiKey, clientSecret: connection.apiSecret,
        organization: connection.organization, id: orderId,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ success: true });
}

export async function handleAcendaDashboardGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = { clientId: connection.apiKey, clientSecret: connection.apiSecret, organization: connection.organization };

    const [channels, warehouses, catalog, inventory] = await Promise.all([
        getSalesChannelsAcenda(creds),
        getWarehouseAcenda(creds),
        getCatalogAcenda(creds),
        getInventoryDetailAcenda({ ...creds, limit: 100 }),
    ]);

    return NextResponse.json({
        channels: channels?.channels ?? [],
        warehouses: Array.isArray(warehouses) ? warehouses : [],
        catalog: Array.isArray(catalog) ? catalog : [],
        inventory: inventory?.inventory ?? [],
        inventoryTotal: inventory?.total ?? 0,
    });
}
