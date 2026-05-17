import axios from "axios";

const BASE = "https://www.faire.com/external-api/v2";

// ---------------------------------------------------------------------------
// Base request helper
// Supports simple token auth (single brand) or OAuth (multi-brand partners).
// For simple brand token: pass apiKey only.
// For OAuth: pass oauthToken + appCredentials (Base64 appId:appSecret).
// ---------------------------------------------------------------------------
const faireRequest = async ({ apiKey, oauthToken, appCredentials, method = "get", path, params, data }) => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (oauthToken && appCredentials) {
        headers["X-FAIRE-OAUTH-ACCESS-TOKEN"] = oauthToken;
        headers["X-FAIRE-APP-CREDENTIALS"]    = appCredentials;
    } else {
        headers["X-FAIRE-ACCESS-TOKEN"] = apiKey;
    }
    try {
        const res = await axios({ method, url: `${BASE}${path}`, params, data, headers });
        return { data: res.data };
    } catch (e) {
        const detail = e.response?.data ?? e.message;
        console.error(`Faire ${method.toUpperCase()} ${path} error:`, detail);
        return { error: detail };
    }
};

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

export const getBrandProfileFaire = async ({ apiKey }) => {
    const { data, error } = await faireRequest({ apiKey, path: "/brands/profile" });
    if (error) return { error };
    return { brand: data };
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// GET /products — list all brand products
// Supports cursor pagination (pass cursor from previous response)
export const getProductsFaire = async ({ apiKey, page = 1, limit = 50, cursor, updatedAtMin, sku }) => {
    const params = { page, limit };
    if (cursor)       params.cursor = cursor;
    if (updatedAtMin) params.updated_at_min = updatedAtMin;
    if (sku)          params.sku = sku;
    const { data, error } = await faireRequest({ apiKey, path: "/products", params });
    if (error) return { error };
    return { products: data?.products ?? [], page: data?.page, cursor: data?.cursor };
};

// GET /products/:id
export const getProductFaire = async ({ apiKey, productId }) => {
    const { data, error } = await faireRequest({ apiKey, path: `/products/${productId}` });
    if (error) return { error };
    return { product: data };
};

// POST /products — create product with variants
// payload shape (ExternalProductV2):
// {
//   name, description, short_description, idempotence_token,
//   unit_multiplier, minimum_order_quantity,
//   variant_option_sets: [{ name: "Color", values: ["Red","Blue"] }],
//   variants: [{
//     sku, idempotence_token, name,
//     options: [{ name: "Color", value: "Red" }],
//     prices: [{ wholesale_price: { amount_minor, currency }, retail_price: { amount_minor, currency } }],
//     available_quantity,
//     images: [{ url }]
//   }],
//   images: [{ url }]
// }
export const createProductFaire = async ({ apiKey, payload }) => {
    const { data, error } = await faireRequest({ apiKey, method: "post", path: "/products", data: payload });
    if (error) return { error };
    return { product: data };
};

// PATCH /products/:id — update product fields and/or variants
export const updateProductFaire = async ({ apiKey, productId, payload }) => {
    const { data, error } = await faireRequest({ apiKey, method: "patch", path: `/products/${productId}`, data: payload });
    if (error) return { error };
    return { product: data };
};

// DELETE /products/:id — set lifecycle_state to DELETED
export const deleteProductFaire = async ({ apiKey, productId }) => {
    const { data, error } = await faireRequest({ apiKey, method: "delete", path: `/products/${productId}` });
    if (error) return { error };
    return { success: true, data };
};

// GET /products/types — Faire taxonomy types (product categories)
export const getTaxonomyTypesFaire = async ({ apiKey }) => {
    const { data, error } = await faireRequest({ apiKey, path: "/products/types" });
    if (error) return { error };
    return { taxonomyTypes: data?.taxonomy_types ?? [] };
};

// POST /products/upload-image — upload base64 image, get CDN url back
export const uploadImageFaire = async ({ apiKey, base64 }) => {
    const { data, error } = await faireRequest({ apiKey, method: "post", path: "/products/upload-image", data: { attachment: base64 } });
    if (error) return { error };
    return { url: data?.url };
};

// ---------------------------------------------------------------------------
// Product variants
// ---------------------------------------------------------------------------

// POST /products/:id/variants — add a new variant
export const addVariantFaire = async ({ apiKey, productId, variant }) => {
    const { data, error } = await faireRequest({ apiKey, method: "post", path: `/products/${productId}/variants`, data: variant });
    if (error) return { error };
    return { variant: data };
};

// PATCH /products/:id/variants/:variantId — update a variant
export const updateVariantFaire = async ({ apiKey, productId, variantId, variant }) => {
    const { data, error } = await faireRequest({ apiKey, method: "patch", path: `/products/${productId}/variants/${variantId}`, data: variant });
    if (error) return { error };
    return { variant: data };
};

// DELETE /products/:id/variants/:variantId
export const deleteVariantFaire = async ({ apiKey, productId, variantId }) => {
    const { data, error } = await faireRequest({ apiKey, method: "delete", path: `/products/${productId}/variants/${variantId}` });
    if (error) return { error };
    return { success: true, data };
};

// ---------------------------------------------------------------------------
// Inventory (current endpoints — not deprecated)
// ---------------------------------------------------------------------------

// GET /product-inventory/by-skus?skus=SKU1,SKU2
export const getInventoryBySkusFaire = async ({ apiKey, skus }) => {
    const { data, error } = await faireRequest({ apiKey, path: "/product-inventory/by-skus", params: { skus: Array.isArray(skus) ? skus.join(",") : skus } });
    if (error) return { error };
    return { inventories: data?.inventories ?? {} };
};

// PATCH /product-inventory/by-skus — bulk update on-hand inventory by SKU
// inventories: [{ sku, on_hand_quantity }]
export const updateInventoryBySkusFaire = async ({ apiKey, inventories }) => {
    const { data, error } = await faireRequest({
        apiKey, method: "patch", path: "/product-inventory/by-skus",
        data: { inventories },
    });
    if (error) return { error };
    return { inventories: data?.inventories ?? {} };
};

// PATCH /product-inventory/by-product-variant-ids — bulk update by variant ID
// inventories: [{ product_variant_id, on_hand_quantity }]
export const updateInventoryByIdsFaire = async ({ apiKey, inventories }) => {
    const { data, error } = await faireRequest({
        apiKey, method: "patch", path: "/product-inventory/by-product-variant-ids",
        data: { inventories },
    });
    if (error) return { error };
    return { inventories: data?.inventories ?? {} };
};

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

// PATCH /product-prices/by-skus
// prices: [{ sku, prices: [{ wholesale_price: { amount_minor, currency }, retail_price: { amount_minor, currency } }] }]
export const updatePricesBySkusFaire = async ({ apiKey, prices }) => {
    const { data, error } = await faireRequest({ apiKey, method: "patch", path: "/product-prices/by-skus", data: { prices } });
    if (error) return { error };
    return { results: data?.results ?? {} };
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// GET /orders — list orders
// excluded_states: comma-separated list of states to exclude
export const getOrdersFaire = async ({ apiKey, page = 1, limit = 50, cursor, updatedAtMin, createdAtMin, excludedStates, sortBy }) => {
    const params = { page, limit };
    if (cursor)         params.cursor = cursor;
    if (updatedAtMin)   params.updated_at_min = updatedAtMin;
    if (createdAtMin)   params.created_at_min = createdAtMin;
    if (excludedStates) params.excluded_states = Array.isArray(excludedStates) ? excludedStates.join(",") : excludedStates;
    if (sortBy)         params.sort_by = sortBy;
    const { data, error } = await faireRequest({ apiKey, path: "/orders", params });
    if (error) return { error };
    return { orders: data?.orders ?? [], page: data?.page, cursor: data?.cursor };
};

// GET /orders/:id
export const getOrderFaire = async ({ apiKey, orderId }) => {
    const { data, error } = await faireRequest({ apiKey, path: `/orders/${orderId}` });
    if (error) return { error };
    return { order: data };
};

// PUT /orders/:id/processing — accept order → PROCESSING
// expectedShipDate: ISO 8601 string (optional)
export const acceptOrderFaire = async ({ apiKey, orderId, expectedShipDate }) => {
    const body = {};
    if (expectedShipDate) body.expected_ship_date = expectedShipDate;
    const { data, error } = await faireRequest({ apiKey, method: "put", path: `/orders/${orderId}/processing`, data: body });
    if (error) return { error };
    return { success: true, order: data };
};

// POST /orders/:id/shipments — add shipment tracking → PRE_TRANSIT
// shipments: [{ carrier, tracking_code }]
// Valid carriers: USPS, UPS, FEDEX, DHL_EXPRESS, DHL_ECOMMERCE, CANADA_POST, etc.
export const shipOrderFaire = async ({ apiKey, orderId, shipments }) => {
    const { data, error } = await faireRequest({
        apiKey, method: "post", path: `/orders/${orderId}/shipments`,
        data: { shipments: Array.isArray(shipments) ? shipments : [shipments] },
    });
    if (error) return { error };
    return { success: true, order: data };
};

// PUT /orders/:id/cancel — cancel order
// reason: one of REQUESTED_BY_RETAILER | ITEM_OUT_OF_STOCK | INCORRECT_PRICING | OTHER | etc.
// note: 30-1000 chars
export const cancelOrderFaire = async ({ apiKey, orderId, reason, note }) => {
    const { data, error } = await faireRequest({ apiKey, method: "put", path: `/orders/${orderId}/cancel`, data: { reason, note } });
    if (error) return { error };
    return { success: true, order: data };
};

// POST /orders/:id/items/availability — mark items as backordered/discontinued
// availabilities: { [order_item_id]: { available_quantity?, discontinued?, backordered_until? } }
export const updateOrderItemAvailabilityFaire = async ({ apiKey, orderId, availabilities }) => {
    const { data, error } = await faireRequest({ apiKey, method: "post", path: `/orders/${orderId}/items/availability`, data: { availabilities } });
    if (error) return { error };
    return { success: true, order: data };
};

// ---------------------------------------------------------------------------
// Retailers
// ---------------------------------------------------------------------------

export const getRetailerFaire = async ({ apiKey, retailerId }) => {
    const { data, error } = await faireRequest({ apiKey, path: `/retailers/public/${retailerId}` });
    if (error) return { error };
    return { retailer: data };
};
