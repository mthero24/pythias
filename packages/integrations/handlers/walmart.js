import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products, Blank } from "@pythias/mongo";
import { randomUUID } from "crypto";
import {
    getItemsWalmart, retireItemWalmart,
    getOrdersWalmart, getReleasedOrdersWalmart, acknowledgeOrderWalmart, shipOrderWalmart,
    listFeedsWalmart, getFeedWalmart, getFeedItemsWalmart,
    getInventoryWalmart, updateInventoryWalmart,
    updatePriceWalmart,
} from "../functions/walmart.js";

// ---------------------------------------------------------------------------
// Feed submission (direct, no module-level token cache)
// ---------------------------------------------------------------------------
const WALMART_BASE = "https://marketplace.walmartapis.com/v3";

async function submitFeedDirect(clientId, clientSecret, feedType, payload) {
    const tokenRes = await fetch(`${WALMART_BASE}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "WM_SVC.NAME": "Walmart Marketplace",
            "WM_QOS.CORRELATION_ID": randomUUID(),
            "WM_CONSUMER.CHANNEL.TYPE": "B2C",
            Accept: "application/json",
        },
        body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    const token = tokenData?.access_token ?? null;
    console.log(`[Walmart] token status=${tokenRes.status} token=${token ? token.slice(0, 10) + "..." : "NULL"}`);
    if (!token) return { error: { tokenStatus: tokenRes.status, tokenBody: tokenData } };

    const form = new FormData();
    form.append("file", new Blob([JSON.stringify(payload)], { type: "application/json" }), "feed.json");

    const feedUrl = `${WALMART_BASE}/feeds?feedType=${encodeURIComponent(feedType)}`;
    console.log(`[Walmart] POST ${feedUrl}`);

    const feedRes = await fetch(feedUrl, {
        method: "POST",
        body: form,
        headers: {
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_CONSUMER.ID": clientId,
            "WM_CONSUMER.CHANNEL.TYPE": "B2C",
            "WM_SVC.NAME": "Walmart Marketplace",
            "WM_QOS.CORRELATION_ID": randomUUID(),
            Accept: "application/json",
        },
    });
    const feedData = await feedRes.json().catch(() => ({}));
    console.log(`[Walmart] feed response status=${feedRes.status}:`, JSON.stringify(feedData).slice(0, 500));
    if (!feedRes.ok) return { error: feedData };
    return { feedId: feedData?.feedId ?? null };
}

// ---------------------------------------------------------------------------
// Product type / gender taxonomy maps
// ---------------------------------------------------------------------------
const WALMART_PRODUCT_TYPE_MAP = {
    "t-shirt":    "T-Shirts",
    "tee":        "T-Shirts",
    "shirt":      "T-Shirts",
    "hoodie":     "Sweatshirts & Hoodies",
    "sweatshirt": "Sweatshirts & Hoodies",
    "crewneck":   "Sweatshirts & Hoodies",
    "tank":       "Tank Tops",
    "polo":       "Polo Shirts",
    "jacket":     "Jackets & Coats",
    "hat":        "Hats",
    "cap":        "Hats",
    "beanie":     "Hats",
    "bodysuit":   "Baby Bodysuits & One-Pieces",
    "onesie":     "Baby Bodysuits & One-Pieces",
    "set":        "Clothing Sets",
    "tote":       "Tote Bags",
    "bag":        "Tote Bags",
    "backpack":   "Backpacks",
    "mug":        "Mugs",
    "tumbler":    "Tumblers",
};

const PROP65_TYPES = new Set(["Sweatshirts & Hoodies"]);
const LONG_DESC_TYPES = new Set(["Sweatshirts & Hoodies"]);
const APPAREL_TYPES = new Set([
    "T-Shirts", "Sweatshirts & Hoodies", "Tank Tops", "Polo Shirts",
    "Jackets & Coats", "Hats", "Baby Bodysuits & One-Pieces", "Clothing Sets",
]);
const APPROVED_WALMART_TYPES = new Set([
    "T-Shirts", "Sweatshirts & Hoodies", "Tank Tops", "Baby Bodysuits & One-Pieces",
]);

function mapProductType(category) {
    if (!category) return "T-Shirts";
    const key = String(category).toLowerCase().trim();
    for (const [match, val] of Object.entries(WALMART_PRODUCT_TYPE_MAP)) {
        if (key.includes(match)) return val;
    }
    return category;
}

function mapGender(raw) {
    if (!raw) return "Unisex";
    const key = String(raw).toLowerCase().trim();
    if (key.includes("female") || key.includes("women") || key.includes("woman")) return "Female";
    if (key.includes("girls") || key.includes("girl")) return "Girls";
    if (key.includes("boys") || key.includes("boy")) return "Boys";
    if (key.includes("male") || key.includes("men") || key.includes("man")) return "Male";
    return "Unisex";
}

function isValidUrl(s) {
    return typeof s === "string" && s.startsWith("http");
}

function cleanUrl(u) {
    return u?.replace(/%7D(\?|$)/, "$1").replace(/width=400/g, "width=2400") ?? u;
}

function allProductImages(product) {
    return [
        ...((product.productImages ?? []).map(i => cleanUrl(i.image))),
        ...((product.variantsArray ?? []).flatMap(v => [
            cleanUrl(v.image),
            ...((v.images ?? []).map(cleanUrl)),
        ])),
    ].filter(isValidUrl);
}

function buildMPItem(product, blank, variant, isPrimary, variantAttrs, productImagePool, productOverrides = {}) {
    const colorName = variant.color?.name?.trim() || "Default";
    const sizeObj  = (blank?.sizes ?? []).find(s => s._id?.toString() === String(variant.size));
    const sizeName = sizeObj?.name?.trim() || (variantAttrs.includes("size") ? "One Size" : "");
    const weightLb = Math.max(0.1, Number(((sizeObj?.weight ?? 8) / 16).toFixed(2)));
    const price    = Number(Number(variant.price ?? sizeObj?.retailPrice).toFixed(2)) || 0.01;

    const title   = String(product.title ?? product.name ?? "").trim() || "Product";
    const brand   = String(product.brand || "Simply Sage Market").trim();
    const rawDesc = String(product.description ?? product.title ?? product.name ?? "") || `${brand} ${title}`;
    const description = (rawDesc.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).join(" ").slice(0, 4000)) || "See product details";

    const parentSku   = String(product.sku ?? product.name?.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() ?? variant.sku);
    const rawCategory = blank?.category?.[0] ?? product.category?.[0] ?? "T-Shirt";
    const productType = mapProductType(rawCategory);
    const isApparel   = APPAREL_TYPES.has(productType);

    const walmartOverrides = blank?.marketPlaceOverrides?.["Walmart"] ?? blank?.marketPlaceOverrides?.["walmart"] ?? {};

    const keyFeatures = (blank?.bulletPoints ?? [])
        .map(bp => [bp.title, bp.description].filter(Boolean).join(": "))
        .filter(Boolean)
        .slice(0, 3);

    const mainImage = [variant.image, product.productImages?.[0]?.image, ...productImagePool]
        .map(cleanUrl).find(isValidUrl) ?? null;
    const secondaryImages = [...new Set([
        ...((product.productImages ?? []).map(i => cleanUrl(i.image))),
        ...((variant.images ?? []).map(cleanUrl)),
    ])].filter(isValidUrl).filter(u => u !== mainImage).slice(0, 8);

    const nameParts = [title, colorName];
    if (variantAttrs.includes("size") && sizeName && sizeName !== "One Size") nameParts.push(sizeName);
    const productName = nameParts.filter(Boolean).join(" - ").trim();

    const missing = [];
    if (!colorName) missing.push("color");
    if (!sizeName && variantAttrs.includes("size")) missing.push("size");
    if (!mainImage) missing.push("mainImageUrl");
    if (!productName) missing.push("productName");
    if (!description) missing.push("shortDescription");
    if (!brand) missing.push("brand");
    if (price <= 0) missing.push("price");
    if (missing.length) {
        console.error(`[Walmart] buildMPItem MISSING FIELDS sku=${variant.sku}:`, missing.join(", "));
    }

    const item = {
        processMode:    "REPLACE",
        sku:            String(variant.sku),
        productIdentifiers: {
            productIdentifier: [{ productIdType: "UPC", productId: String(variant.upc) }],
        },
        productType,
        productName,
        shortDescription:   description,
        ...(LONG_DESC_TYPES.has(productType) ? { longDescription: description } : {}),
        price:              { currency: "USD", amount: price },
        ShippingWeight:     { value: weightLb, unit: "LB" },
        brand,
        productCondition:   "New",
        availabilityStatus: "IN_STOCK",
        fulfillmentLagTime: 1,
        ...(PROP65_TYPES.has(productType) ? { prop65WarningText: "" } : {}),
        variantGroupId:     parentSku,
        isPrimaryVariant:   isPrimary,
        variantAttributeNames: { variantAttributeName: variantAttrs },
        color:              colorName,
        ...(keyFeatures.length > 0 ? { keyFeatures } : {}),
    };

    if (isApparel) {
        item.gender = mapGender(product.gender);
        if (variantAttrs.includes("size") && sizeName) {
            item.size = sizeName;
        }
    }

    if (Object.keys(walmartOverrides).length > 0) {
        Object.assign(item, walmartOverrides);
    }

    const SKIP_KEYS = new Set(["name", "titleGenerator"]);
    for (const [k, v] of Object.entries(productOverrides)) {
        if (!SKIP_KEYS.has(k) && v !== "" && v != null) item[k] = v;
    }

    if (mainImage) {
        item.mainImageUrl   = mainImage;
        item.swatchImageUrl = mainImage;
    }
    if (secondaryImages.length > 0) {
        item.productSecondaryImageURL = secondaryImages;
    }

    return item;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function handleWalmartGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getItemsWalmart({
        clientId:        connection.apiKey,
        clientSecret:    connection.apiSecret,
        sku:             searchParams.get("sku") || undefined,
        gtin:            searchParams.get("gtin") || undefined,
        limit:           parseInt(searchParams.get("limit") ?? "20", 10),
        offset:          parseInt(searchParams.get("offset") ?? "0", 10),
        lifecycleStatus: searchParams.get("lifecycleStatus") || undefined,
        publishedStatus: searchParams.get("publishedStatus") || undefined,
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const sku = searchParams.get("sku");
    if (!connectionId || !sku) return NextResponse.json({ error: "connectionId and sku required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await retireItemWalmart({ clientId: connection.apiKey, clientSecret: connection.apiSecret, sku });
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartSendPOST(req) {
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

    const blank = product.blanks?.[0] ?? null;

    const validVariants = (product.variantsArray ?? []).filter(v => v.sku && v.upc);
    if (validVariants.length === 0) {
        return NextResponse.json({ error: "No variants with both SKU and UPC" }, { status: 400 });
    }

    const sizes = new Set(validVariants.map(v => {
        const s = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size));
        return s?.name?.trim() ?? "";
    }).filter(Boolean));
    const colors = new Set(validVariants.map(v => v.color?.name?.trim() ?? "").filter(Boolean));

    const variantAttrs = [];
    if (colors.size > 1 || validVariants.length > 1) variantAttrs.push("color");
    if (sizes.size > 1) variantAttrs.push("size");
    if (variantAttrs.length === 0) variantAttrs.push("color");

    const rawCategory = blank?.category?.[0] ?? product.category?.[0] ?? "";
    const productType = mapProductType(rawCategory);
    if (!APPROVED_WALMART_TYPES.has(productType)) {
        return NextResponse.json({
            error: `"${productType}" is not authorized to sell on Walmart Marketplace. Currently approved: ${[...APPROVED_WALMART_TYPES].join(", ")}.`,
            notAuthorized: true,
        }, { status: 400 });
    }

    const productImagePool = allProductImages(product);
    const productOverrides = product.marketplaceValues?.[connectionId] ?? product.marketplaceValues?.[String(connectionId)] ?? {};

    const MPItem = validVariants.map((v, i) => buildMPItem(product, blank, v, i === 0, variantAttrs, productImagePool, productOverrides));

    const itemWarnings = MPItem.flatMap((item, i) => {
        const required = ["sku", "productType", "productName", "shortDescription", "brand", "color", "mainImageUrl", "variantGroupId"];
        return required.filter(f => !item[f]).map(f => `item[${i}].${f} is empty/null (sku=${item.sku})`);
    });
    if (itemWarnings.length) {
        console.error("[Walmart] payload warnings:", itemWarnings);
        return NextResponse.json({ error: "Payload has missing required fields", warnings: itemWarnings, sentPayload: MPItem }, { status: 400 });
    }

    const payload = {
        MPItemFeedHeader: { version: "2.0.20240126-12_25_52-api", locale: "en" },
        MPItem,
    };

    console.log("[Walmart] first MPItem:", JSON.stringify(MPItem[0], null, 2));
    console.log("[Walmart] total variants:", MPItem.length);

    const { feedId, error } = await submitFeedDirect(connection.apiKey, connection.apiSecret, "MP_ITEM", payload);

    if (error) {
        return NextResponse.json({ error, firstItem: MPItem[0], totalVariants: MPItem.length }, { status: 502 });
    }
    if (!feedId) {
        return NextResponse.json({ error: "No feedId returned from Walmart", firstItem: MPItem[0] }, { status: 502 });
    }
    return NextResponse.json({ feedId });
}

export async function handleWalmartOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = { clientId: connection.apiKey, clientSecret: connection.apiSecret };
    const released = searchParams.get("released") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const fn = released ? getReleasedOrdersWalmart : getOrdersWalmart;
    const result = await fn({
        ...creds,
        createdStartDate: searchParams.get("createdStartDate"),
        limit,
        nextCursor: searchParams.get("nextCursor"),
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartOrdersPOST(req) {
    const { connectionId, purchaseOrderId, action, lines } = await req.json();
    if (!connectionId || !purchaseOrderId || !action) {
        return NextResponse.json({ error: "connectionId, purchaseOrderId, and action are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = { clientId: connection.apiKey, clientSecret: connection.apiSecret };

    if (action === "acknowledge") {
        const result = await acknowledgeOrderWalmart({ ...creds, purchaseOrderId });
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }

    if (action === "ship") {
        if (!lines?.length) return NextResponse.json({ error: "lines required for ship action" }, { status: 400 });
        const result = await shipOrderWalmart({ ...creds, purchaseOrderId, lines });
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function handleWalmartFeedGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = { clientId: connection.apiKey, clientSecret: connection.apiSecret };
    const feedId = searchParams.get("feedId");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    if (feedId && searchParams.get("detail") === "true") {
        const result = await getFeedItemsWalmart({ ...creds, feedId, limit, offset });
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }
    if (feedId) {
        const result = await getFeedWalmart({ ...creds, feedId });
        if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json(result);
    }

    const result = await listFeedsWalmart({ ...creds, limit, offset });
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartImageGET(req) {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku");
    if (!sku) return NextResponse.json({ error: "sku required" }, { status: 400 });

    const product = await Products.findOne(
        { "variantsArray.sku": sku },
        { variantsArray: 1, productImages: 1, blanks: 1 }
    ).lean();

    if (!product) return NextResponse.json({ error: "Product not found for SKU" }, { status: 404 });

    const variant = product.variantsArray?.find(v => v.sku === sku);
    if (!variant)   return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    const variantImage = variant.image ?? product.productImages?.[0]?.image ?? null;
    if (variantImage?.startsWith("http")) {
        return NextResponse.json({ imageUrl: variantImage });
    }

    const blankId = variant.blank ?? product.blanks?.[0];
    if (!blankId) return NextResponse.json({ error: "No image available" }, { status: 404 });

    const blank = await Blank.findById(blankId).populate("colors").lean();
    if (!blank) return NextResponse.json({ error: "Blank not found" }, { status: 404 });

    const color = blank.colors?.find(c => c._id?.toString() === variant.color?.toString());
    let blankImg = blank.images?.find(i =>
        i.color?.toString() === color?._id?.toString() && i.boxes?.front
    );
    if (!blankImg) blankImg = blank.images?.[0] ?? null;
    if (!blankImg?.image) return NextResponse.json({ error: "No blank image found" }, { status: 404 });

    const designImageUrl = product.productImages?.[0]?.image ?? null;
    const box = blankImg.boxes?.front ? [{ ...blankImg.boxes.front, side: "front" }] : null;

    const origin = new URL(req.url).origin;
    try {
        const res = await fetch(`${origin}/api/renderImages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                styleImage:  blankImg.image,
                designImage: designImageUrl ? { front: designImageUrl } : null,
                box,
                width: 800,
            }),
        });
        const json = await res.json();
        if (json.base64) return NextResponse.json({ imageUrl: json.base64 });
    } catch (e) {
        console.error("renderImages error:", e.message);
    }

    return NextResponse.json({ imageUrl: blankImg.image });
}

export async function handleWalmartInventoryGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const sku = searchParams.get("sku");
    if (!connectionId || !sku) return NextResponse.json({ error: "connectionId and sku required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getInventoryWalmart({
        clientId: connection.apiKey,
        clientSecret: connection.apiSecret,
        sku,
        shipNode: searchParams.get("shipNode"),
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartInventoryPUT(req) {
    const { connectionId, sku, amount, shipNode } = await req.json();
    if (!connectionId || !sku || amount == null) {
        return NextResponse.json({ error: "connectionId, sku, and amount are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await updateInventoryWalmart({
        clientId: connection.apiKey,
        clientSecret: connection.apiSecret,
        sku,
        amount: Math.round(amount),
        shipNode,
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartPricePUT(req) {
    const { connectionId, sku, amount, currency } = await req.json();
    if (!connectionId || !sku || amount == null) {
        return NextResponse.json({ error: "connectionId, sku, and amount are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await updatePriceWalmart({
        clientId: connection.apiKey,
        clientSecret: connection.apiSecret,
        sku,
        amount,
        currency: currency ?? "USD",
    });

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json(result);
}

export async function handleWalmartSpecGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const productType  = searchParams.get("productType");
    const inspect      = searchParams.get("inspect");
    const taxonomy     = searchParams.get("taxonomy");

    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    // Get token for direct API calls
    const tokenRes = await fetch(`${WALMART_BASE}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${connection.apiKey}:${connection.apiSecret}`).toString("base64")}`,
            "WM_SVC.NAME": "Walmart Marketplace",
            "WM_QOS.CORRELATION_ID": randomUUID(),
            "WM_CONSUMER.CHANNEL.TYPE": "B2C",
            Accept: "application/json",
        },
        body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    const token = tokenData?.access_token ?? null;
    if (!token) return NextResponse.json({ error: "Auth failed", detail: tokenData }, { status: 502 });

    const wHeaders = {
        "WM_SEC.ACCESS_TOKEN": token,
        "WM_CONSUMER.ID": connection.apiKey,
        "WM_CONSUMER.CHANNEL.TYPE": "B2C",
        "WM_SVC.NAME": "Walmart Marketplace",
        "WM_QOS.CORRELATION_ID": randomUUID(),
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (inspect) {
        const res = await fetch(`${WALMART_BASE}/items?limit=20`, { headers: wHeaders });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data }, { status: 502 });
        const items = data?.ItemResponse ?? [];
        const productTypes = [...new Set(items.map(i => i.productType).filter(Boolean))];
        return NextResponse.json({ productTypes, sampleItem: items[0] ?? null, totalResults: data?.totalResults });
    }

    if (taxonomy) {
        const search = searchParams.get("search") || "";
        const body = {
            categorizationType: "CATEGORY",
            meta: { limit: 100 },
            ...(search ? { filterCriteria: { searchText: search } } : {}),
        };
        const res = await fetch(
            "https://marketplace.walmartapis.com/v3/growth/assortment/recommendations/categorization/counts",
            {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "WM_CONSUMER.ID": connection.organization ?? connection.apiKey,
                    "WM_QOS.CORRELATION_ID": randomUUID(),
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data }, { status: 502 });
        return NextResponse.json(data);
    }

    if (!productType) {
        return NextResponse.json({ error: "productType, taxonomy=1, or inspect=1 required" }, { status: 400 });
    }

    return NextResponse.json({
        error: "SPEC_USE_SELLER_CENTER",
        message: "Walmart's spec API requires internal taxonomy codes not available via the public API.",
        instructions: "Download the spec template from Walmart Seller Center: Catalog → Item Spec → Download Spec Template, then select your product type.",
        productType,
    }, { status: 501 });
}

export async function handleWalmartTestPOST(req) {
    const { clientId, clientSecret } = await req.json();
    if (!clientId || !clientSecret) {
        return NextResponse.json({ ok: false, error: "clientId and clientSecret required" }, { status: 400 });
    }

    const result = await getItemsWalmart({ clientId, clientSecret, limit: 1 });
    if (result?.error) {
        return NextResponse.json({
            ok: false,
            error: typeof result.error === "string" ? result.error : "Authentication failed",
        });
    }
    return NextResponse.json({ ok: true });
}
