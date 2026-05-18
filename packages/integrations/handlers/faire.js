import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products } from "@pythias/mongo";
import {
    getProductsFaire, createProductFaire, updateProductFaire,
    getInventoryBySkusFaire, updateInventoryBySkusFaire,
    getOrdersFaire, acceptOrderFaire, shipOrderFaire, cancelOrderFaire,
} from "../functions/faire.js";

function toMinor(dollars) {
    return Math.round((Number(dollars) || 0) * 100);
}

function buildVariantOptionSets(variants) {
    const colorValues = [...new Set(variants.map(v => v.color?.name?.trim()).filter(Boolean))];
    const sizeValues  = [...new Set(variants.map(v => v._sizeName).filter(Boolean))];
    const sets = [];
    if (colorValues.length > 0) sets.push({ name: "Color", values: colorValues });
    if (sizeValues.length > 0)  sets.push({ name: "Size",  values: sizeValues });
    return sets;
}

function buildVariant(v, blank, blankOverrides = {}) {
    const sizeObj = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size));
    const colorName = v.color?.name?.trim() || "Default";
    const sizeName  = sizeObj?.name?.trim() || "";

    const wholesaleMinor = toMinor(sizeObj?.wholesaleCost ?? sizeObj?.cost ?? 0) || 100;
    const rawRetailMinor = toMinor(v.price ?? sizeObj?.retailPrice ?? 0) || 200;
    const retailMinor    = Math.min(wholesaleMinor * 10, Math.max(wholesaleMinor * 1.25, rawRetailMinor));

    const availableQuantity = blankOverrides.available_quantity != null
        ? Number(blankOverrides.available_quantity)
        : 9999;

    const options = [];
    if (colorName) options.push({ name: "Color", value: colorName });
    if (sizeName)  options.push({ name: "Size",  value: sizeName });

    return {
        sku:                String(v.sku),
        idempotence_token:  String(v.sku),
        name:               [colorName, sizeName].filter(Boolean).join(" / ") || "Default",
        options,
        available_quantity: availableQuantity,
        prices: [{
            wholesale_price: { amount_minor: wholesaleMinor, currency: "USD" },
            retail_price:    { amount_minor: retailMinor,    currency: "USD" },
            geo_constraint:  { country: "USA" },
        }],
        ...(v.image && typeof v.image === "string" && v.image.startsWith("http")
            ? { images: [{ url: v.image }] } : {}),
    };
}

export async function handleFaireSendPOST(req) {
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

    const apiKey = connection.apiKey;
    const blank  = product.blanks?.[0] ?? null;

    const blankOverrides = blank?.marketPlaceOverrides?.[connection.displayName]
        ?? blank?.marketPlaceOverrides?.["Faire"]
        ?? blank?.marketPlaceOverrides?.["faire"]
        ?? {};

    const SKIP_KEYS = new Set(["titleGenerator"]);
    const productOverrides = Object.fromEntries(
        Object.entries(
            product.marketplaceValues?.[connectionId]
            ?? product.marketplaceValues?.[String(connectionId)]
            ?? {}
        ).filter(([k, v]) => !SKIP_KEYS.has(k) && v !== "" && v != null)
    );

    const validVariants = (product.variantsArray ?? []).filter(v => v.sku);
    if (validVariants.length === 0) {
        return NextResponse.json({ error: "No variants with SKU" }, { status: 400 });
    }

    const enriched = validVariants.map(v => {
        const sizeObj = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size));
        return { ...v, _sizeName: sizeObj?.name?.trim() || "" };
    });

    const title = String(productOverrides.name ?? product.title ?? product.name ?? "").trim() || "Product";
    const brand = String(product.brand || "Simply Sage Market").trim();
    const rawDesc = String(productOverrides.description ?? product.description ?? product.title ?? product.name ?? "") || `${brand} ${title}`;
    const description = rawDesc.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).join(" ").slice(0, 10000) || "See product details";

    const images = [
        ...((product.productImages ?? []).map(i => i.image)),
        ...((product.variantsArray ?? []).map(v => v.image)),
    ].filter(u => typeof u === "string" && u.startsWith("http"))
     .map(url => ({ url }))
     .slice(0, 10);

    const variants           = enriched.map(v => buildVariant(v, blank, blankOverrides));
    const variant_option_sets = buildVariantOptionSets(enriched);

    const PAYLOAD_HANDLED = new Set(["name", "description", "titleGenerator"]);
    const extraOverrides = Object.fromEntries(
        Object.entries(productOverrides).filter(([k]) => !PAYLOAD_HANDLED.has(k))
    );

    const payload = {
        name: title,
        description,
        idempotence_token: String(productId),
        unit_multiplier: productOverrides.unit_multiplier ? Number(productOverrides.unit_multiplier) : 1,
        variants,
        ...(variant_option_sets.length > 0 ? { variant_option_sets } : {}),
        ...(images.length > 0 ? { images } : {}),
        ...extraOverrides,
    };

    const existingFaireId = product.ids?.[connection.displayName]
        ?? product.marketplaceValues?.[connectionId]?.faireProductId
        ?? product.marketplaceValues?.[String(connectionId)]?.faireProductId;

    let result;
    if (existingFaireId) {
        result = await updateProductFaire({ apiKey, productId: existingFaireId, payload });
    } else {
        result = await createProductFaire({ apiKey, payload });
    }

    if (result.error) {
        return NextResponse.json({ error: result.error, sentPayload: payload }, { status: 502 });
    }

    const faireProduct = result.product;
    return NextResponse.json({ success: true, faireProductId: faireProduct?.id, product: faireProduct });
}

export async function handleFaireInventoryGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const skus         = searchParams.get("skus");

    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    if (!skus)         return NextResponse.json({ error: "skus required (comma-separated)" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getInventoryBySkusFaire({ apiKey: connection.apiKey, skus });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ inventories: result.inventories });
}

export async function handleFaireInventoryPATCH(req) {
    const body = await req.json();
    const { connectionId, inventories } = body;

    if (!connectionId || !Array.isArray(inventories) || inventories.length === 0) {
        return NextResponse.json({ error: "connectionId and inventories[] are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await updateInventoryBySkusFaire({ apiKey: connection.apiKey, inventories });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ success: true, inventories: result.inventories });
}

export async function handleFaireOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const page           = Number(searchParams.get("page")  ?? 1);
    const limit          = Number(searchParams.get("limit") ?? 50);
    const cursor         = searchParams.get("cursor");
    const updatedAtMin   = searchParams.get("updatedAtMin");
    const createdAtMin   = searchParams.get("createdAtMin");
    const excludedStates = searchParams.get("excludedStates");
    const sortBy         = searchParams.get("sortBy");

    const result = await getOrdersFaire({
        apiKey: connection.apiKey, page, limit,
        ...(cursor        ? { cursor }        : {}),
        ...(updatedAtMin  ? { updatedAtMin }  : {}),
        ...(createdAtMin  ? { createdAtMin }  : {}),
        ...(excludedStates ? { excludedStates } : {}),
        ...(sortBy        ? { sortBy }        : {}),
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ orders: result.orders ?? [], page: result.page, cursor: result.cursor });
}

export async function handleFaireOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, action, shipment, expectedShipDate, reason, note } = body;

    if (!connectionId || !orderId || !action) {
        return NextResponse.json({ error: "connectionId, orderId, and action are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const apiKey = connection.apiKey;

    if (action === "accept") {
        const result = await acceptOrderFaire({ apiKey, orderId, expectedShipDate });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, data: result });
    }

    if (action === "ship") {
        if (!shipment?.carrier || !shipment?.tracking_code) {
            return NextResponse.json({ error: "shipment.carrier and shipment.tracking_code are required" }, { status: 400 });
        }
        const result = await shipOrderFaire({ apiKey, orderId, shipments: [{ carrier: shipment.carrier, tracking_code: shipment.tracking_code }] });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, data: result });
    }

    if (action === "cancel") {
        if (!reason) return NextResponse.json({ error: "reason is required for cancel" }, { status: 400 });
        const result = await cancelOrderFaire({ apiKey, orderId, reason, ...(note ? { note } : {}) });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: `Unknown action "${action}". Valid: accept, ship, cancel` }, { status: 400 });
}

export async function handleFaireProductsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const page   = Number(searchParams.get("page")  ?? 1);
    const limit  = Number(searchParams.get("limit") ?? 50);
    const cursor = searchParams.get("cursor");

    const result = await getProductsFaire({ apiKey: connection.apiKey, page, limit, ...(cursor ? { cursor } : {}) });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ products: result.products ?? [], page: result.page, cursor: result.cursor });
}
