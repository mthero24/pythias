import axios from "axios";
import { randomUUID } from "crypto";

const BASE = "https://marketplace.walmartapis.com/v3";

// ---------------------------------------------------------------------------
// Token cache — keyed by clientId so multiple seller accounts work correctly
// ---------------------------------------------------------------------------
const tokenCache = new Map(); // clientId -> { token, expiresAt }

const getCachedToken = (clientId) => {
    const entry = tokenCache.get(clientId);
    if (entry && Date.now() < entry.expiresAt) return entry.token;
    return null;
};

const setCachedToken = (clientId, token, expiresIn) => {
    // Expire 60 s early to avoid using a token that's about to die mid-request
    tokenCache.set(clientId, { token, expiresAt: Date.now() + (expiresIn - 60) * 1000 });
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const getToken = async ({ clientId, clientSecret }) => {
    const cached = getCachedToken(clientId);
    if (cached) return cached;

    const body = new URLSearchParams({ grant_type: "client_credentials" });
    let res;
    try {
        res = await axios.post(`${BASE}/token`, body.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "WM_SVC.NAME": "Walmart Marketplace",
                "WM_QOS.CORRELATION_ID": randomUUID(),
                "WM_CONSUMER.CHANNEL.TYPE": "B2C",
                Accept: "application/json",
            },
            auth: { username: clientId, password: clientSecret },
        });
    } catch (e) {
        console.error("Walmart token error:", e.response?.data ?? e.message);
        return null;
    }

    const token = res.data?.access_token;
    const expiresIn = res.data?.expires_in ?? 900;
    if (token) setCachedToken(clientId, token, expiresIn);
    return token ?? null;
};

// ---------------------------------------------------------------------------
// Base request helper — handles auth, standard headers, and error shape
// ---------------------------------------------------------------------------
const walmartRequest = async ({ clientId, clientSecret, method = "get", path, params, data, extraHeaders = {} }) => {
    const token = await getToken({ clientId, clientSecret });
    if (!token) return { error: "Authentication failed — could not obtain Walmart token" };

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        "WM_SEC.ACCESS_TOKEN": token,
        "WM_CONSUMER.ID": clientId,
        "WM_CONSUMER.CHANNEL.TYPE": "B2C",
        "WM_SVC.NAME": "Walmart Marketplace",
        "WM_QOS.CORRELATION_ID": randomUUID(),
        ...extraHeaders,
    };

    try {
        const res = await axios({ method, url: `${BASE}${path}`, params, data, headers });
        return { data: res.data };
    } catch (e) {
        const detail = e.response?.data ?? e.message;
        console.error(`Walmart ${method.toUpperCase()} ${path} error:`, detail);
        return { error: detail };
    }
};

// ---------------------------------------------------------------------------
// Feed upload via native FormData + fetch (avoids axios multipart issues)
// ---------------------------------------------------------------------------
const submitFeed = async ({ clientId, clientSecret, feedType, payload }) => {
    const token = await getToken({ clientId, clientSecret });
    if (!token) return { error: "Authentication failed — could not obtain Walmart token" };

    console.log(`[Walmart] submitFeed feedType=${feedType} token=${token.slice(0, 8)}...`);

    const form = new FormData();
    form.append("file", new Blob([JSON.stringify(payload)], { type: "application/json" }), "feed.json");

    let res;
    try {
        res = await fetch(`${BASE}/feeds?feedType=${encodeURIComponent(feedType)}`, {
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
    } catch (e) {
        console.error(`Walmart feed ${feedType} network error:`, e.message);
        return { error: e.message };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error(`Walmart feed ${feedType} error (${res.status}):`, JSON.stringify(data));
        return { error: data };
    }
    return { feedId: data?.feedId ?? null };
};

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

// GET /v3/items — list all items
// gtin: search by UPC/GTIN (Walmart param: productIdType=GTIN, productId=<value>)
export const getItemsWalmart = async ({ clientId, clientSecret, sku, gtin, limit = 20, offset = 0, lifecycleStatus, publishedStatus }) => {
    const params = { limit, offset };
    if (sku)            params.sku = sku;
    if (gtin)         { params.productIdType = "GTIN"; params.productId = gtin; }
    if (lifecycleStatus) params.lifecycleStatus = lifecycleStatus;
    if (publishedStatus) params.publishedStatus = publishedStatus;

    const { data, error } = await walmartRequest({ clientId, clientSecret, path: "/items", params });
    if (error) return { error };
    return { items: data?.ItemResponse ?? [], totalResults: data?.totalResults ?? 0, nextCursorMark: data?.nextCursorMark };
};

// GET /v3/items/:sku — get a single item
export const getItemWalmart = async ({ clientId, clientSecret, sku }) => {
    const { data, error } = await walmartRequest({ clientId, clientSecret, path: `/items/${encodeURIComponent(sku)}` });
    if (error) return { error };
    return { item: data };
};

// DELETE /v3/items/:sku — retire/unpublish an item
export const retireItemWalmart = async ({ clientId, clientSecret, sku }) => {
    const { data, error } = await walmartRequest({ clientId, clientSecret, method: "delete", path: `/items/${encodeURIComponent(sku)}` });
    if (error) return { error };
    return { success: true, data };
};

// POST /v3/items/spec — download the item spec schema for a product type
export const getSpecWalmart = async ({ clientId, clientSecret, productTypes, version = "2.0.20240126-12_25_52-api" }) => {
    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "post", path: "/items/spec",
        data: { feedType: "MP_ITEM", version, productTypes: Array.isArray(productTypes) ? productTypes : [productTypes] },
    });
    if (error) return { error };
    return { spec: data };
};

// ---------------------------------------------------------------------------
// Feeds — bulk operations
// ---------------------------------------------------------------------------

// Submit an MP_ITEM feed (bulk item create/update)
// payload shape: { MPItemFeedHeader: { version, locale }, MPItem: [...] }
export const bulkUploadWalmart = async ({ clientId, clientSecret, type = "MP_ITEM", payload }) => {
    return submitFeed({ clientId, clientSecret, feedType: type, payload });
};

// Submit a PRICE feed (bulk price update)
// items: [{ sku, currency, amount }]
export const bulkPriceUpdateWalmart = async ({ clientId, clientSecret, items }) => {
    const payload = {
        PriceFeed: {
            PriceHeader: { version: "1.5.1" },
            Price: items.map(i => ({
                itemIdentifier: { sku: i.sku },
                pricingList: {
                    pricing: [{
                        currentPrice: { value: { currency: i.currency ?? "USD", amount: i.amount } },
                        currentPriceType: "BASE",
                    }],
                },
            })),
        },
    };
    return submitFeed({ clientId, clientSecret, feedType: "PRICE", payload });
};

// Submit an MP_ITEM_INVENTORY feed (bulk inventory update)
// items: [{ sku, amount, shipNode? }]
export const bulkInventoryUpdateWalmart = async ({ clientId, clientSecret, items }) => {
    const payload = {
        InventoryHeader: { version: "1.4" },
        Inventory: items.map(i => ({
            sku: i.sku,
            quantity: { unit: "EACH", amount: i.amount },
            ...(i.shipNode ? { shipNode: i.shipNode } : {}),
        })),
    };
    return submitFeed({ clientId, clientSecret, feedType: "MP_ITEM_INVENTORY", payload });
};

// GET /v3/feeds — list all feed statuses
export const listFeedsWalmart = async ({ clientId, clientSecret, feedId, offset = 0, limit = 50 }) => {
    const params = { offset, limit };
    if (feedId) params.feedId = feedId;
    const { data, error } = await walmartRequest({ clientId, clientSecret, path: "/feeds", params });
    if (error) return { error };
    return { results: data?.results ?? data };
};

// GET /v3/feeds/:feedId — get a single feed status
export const getFeedWalmart = async ({ clientId, clientSecret, feedId }) => {
    const { data, error } = await walmartRequest({ clientId, clientSecret, path: `/feeds/${feedId}` });
    if (error) return { error };
    return data;
};

// GET /v3/feeds/:feedId/items — get item-level status within a feed
export const getFeedItemsWalmart = async ({ clientId, clientSecret, feedId, limit = 50, offset = 0 }) => {
    const { data, error } = await walmartRequest({
        clientId, clientSecret, path: `/feeds/${feedId}/items`, params: { limit, offset },
    });
    if (error) return { error };
    return { itemDetails: data?.itemDetails ?? data };
};

// ---------------------------------------------------------------------------
// Price & Inventory — single-item updates
// ---------------------------------------------------------------------------

// PUT /v3/price — update price for a single SKU
export const updatePriceWalmart = async ({ clientId, clientSecret, sku, amount, currency = "USD" }) => {
    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "put", path: "/price",
        data: {
            sku,
            pricing: [{
                currentPriceType: "BASE",
                currentPrice: { currency, amount },
            }],
        },
    });
    if (error) return { error };
    return { success: true, data };
};

// GET /v3/inventory — get inventory for a SKU
export const getInventoryWalmart = async ({ clientId, clientSecret, sku, shipNode }) => {
    const params = { sku };
    if (shipNode) params.shipNode = shipNode;
    const { data, error } = await walmartRequest({ clientId, clientSecret, path: "/inventory", params });
    if (error) return { error };
    return { inventory: data };
};

// PUT /v3/inventory — update inventory for a single SKU
export const updateInventoryWalmart = async ({ clientId, clientSecret, sku, amount, shipNode }) => {
    const body = {
        sku,
        quantity: { unit: "EACH", amount },
    };
    if (shipNode) body.shipNode = shipNode;
    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "put", path: "/inventory",
        params: { sku }, data: body,
    });
    if (error) return { error };
    return { success: true, data };
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// GET /v3/orders — all orders with filters
export const getOrdersWalmart = async ({
    clientId, clientSecret,
    createdStartDate, createdEndDate,
    status, limit = 100, nextCursor,
}) => {
    const params = { limit: Math.min(limit, 200) };
    if (createdStartDate) params.createdStartDate = createdStartDate;
    if (createdEndDate) params.createdEndDate = createdEndDate;
    if (status) params.status = status;
    if (nextCursor) params.nextCursor = nextCursor;

    const { data, error } = await walmartRequest({ clientId, clientSecret, path: "/orders", params });
    if (error) return { error };
    return {
        orders: data?.list?.elements?.order ?? [],
        nextCursor: data?.list?.meta?.nextCursor ?? null,
        hasMore: !!data?.list?.meta?.nextCursor,
        total: data?.list?.meta?.totalCount ?? 0,
    };
};

// GET /v3/orders/released — orders released and ready to fulfill
export const getReleasedOrdersWalmart = async ({ clientId, clientSecret, createdStartDate, limit = 100, nextCursor }) => {
    const params = { limit: Math.min(limit, 200) };
    if (createdStartDate) params.createdStartDate = createdStartDate;
    if (nextCursor) params.nextCursor = nextCursor;

    const { data, error } = await walmartRequest({ clientId, clientSecret, path: "/orders/released", params });
    if (error) return { error };
    return {
        orders: data?.list?.elements?.order ?? [],
        nextCursor: data?.list?.meta?.nextCursor ?? null,
        hasMore: !!data?.list?.meta?.nextCursor,
        total: data?.list?.meta?.totalCount ?? 0,
    };
};

// GET /v3/orders/:purchaseOrderId — single order
export const getOrderWalmart = async ({ clientId, clientSecret, purchaseOrderId }) => {
    const { data, error } = await walmartRequest({ clientId, clientSecret, path: `/orders/${purchaseOrderId}` });
    if (error) return { error };
    return { order: data?.order ?? data };
};

// POST /v3/orders/:purchaseOrderId/acknowledge — acknowledge a single order
export const acknowledgeOrderWalmart = async ({ clientId, clientSecret, purchaseOrderId }) => {
    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "post",
        path: `/orders/${purchaseOrderId}/acknowledge`, data: {},
    });
    if (error) return { error };
    return { success: true, order: data?.order ?? data };
};

// POST /v3/orders/bulk/acknowledge — acknowledge multiple orders at once
export const bulkAcknowledgeOrdersWalmart = async ({ clientId, clientSecret, purchaseOrderIds }) => {
    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "post", path: "/orders/bulk/acknowledge",
        data: { orderIds: purchaseOrderIds },
    });
    if (error) return { error };
    return { success: true, data };
};

// POST /v3/orders/:purchaseOrderId/shipping — mark order lines as shipped
// lines: [{ lineNumber, quantity, trackingNumber, carrier, methodCode?, shipDateTime? }]
// Valid carriers: USPS, UPS, FedEx, DHL
// Valid methodCodes: Standard (default), Express, OneDay, Freight, WhiteGlove, Value, Expedited
export const shipOrderWalmart = async ({ clientId, clientSecret, purchaseOrderId, lines }) => {
    const orderLine = lines.map(l => ({
        lineNumber: String(l.lineNumber),
        orderLineStatuses: {
            orderLineStatus: [{
                status: "Shipped",
                statusQuantity: {
                    unitOfMeasurement: "EACH",
                    amount: String(l.quantity ?? 1),
                },
                trackingInfo: {
                    shipDateTime: l.shipDateTime ?? new Date().toISOString(),
                    carrierName: { carrier: l.carrier ?? "USPS" },
                    trackingNumber: l.trackingNumber,
                    methodCode: l.methodCode ?? "Standard",
                },
            }],
        },
    }));

    const { data, error } = await walmartRequest({
        clientId, clientSecret, method: "post",
        path: `/orders/${purchaseOrderId}/shipping`,
        data: {
            orderShipment: {
                orderLines: { orderLine },
            },
        },
    });
    if (error) return { error };
    return { success: true, order: data?.order ?? data };
};
