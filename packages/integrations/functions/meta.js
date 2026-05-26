import axios from "axios";

const GRAPH_VERSION = "v25.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

// access_token must be a query param per Meta Graph API docs
const metaRequest = async (method, path, data, credentials) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${path}`,
            headers: { "Content-Type": "application/json" },
            params: { access_token: credentials.apiKey },
        };
        if (method === "GET") {
            config.params = { ...config.params, ...data };
        } else {
            config.data = data;
        }
        const res = await axios(config);
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.error?.message ?? e.message;
        throw new Error(`Meta API ${method} ${path}: ${msg}`);
    }
};

// Orders come in as CREATED; must acknowledge before processing
export const getMetaOrders = async (credentials, after) => {
    const pageId = credentials.shopId;
    const params = {
        state: "CREATED",
        filters: "no_shipments,no_cancellations",
        limit: 100,
        fields: "id,order_status,created,buyer_details,ship_to,selected_shipping_option,order_total_amount",
    };
    if (after) params.after = after;
    return await metaRequest("GET", `/${pageId}/commerce_orders`, params, credentials);
};

// Must acknowledge orders before fulfilling — moves state to IN_PROGRESS
export const acknowledgeMetaOrders = async (orderIds, credentials) => {
    const pageId = credentials.shopId;
    return await metaRequest("POST", `/${pageId}/acknowledge_orders`, {
        idempotency_key: `ack-${Date.now()}`,
        orders: orderIds.map(id => ({ id })),
    }, credentials);
};

export const createMetaProduct = async (product, credentials) => {
    const catalogId = credentials.shopId;
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const requests = product.variantsArray.map(v => ({
        method: "CREATE",
        data: {
            retailer_id: v.sku,
            name: product.name,
            description: product.description ?? "",
            price: Math.round(parseFloat(v.price ?? basePrice ?? 0) * 100),
            currency: "USD",
            availability: "in stock",
            condition: "new",
            image_url: v.image ?? product.variantsArray[0]?.image ?? "",
            url: `https://example.com/products/${product._id}`,
        },
    }));
    const res = await metaRequest("POST", `/${catalogId}/batch`, { requests }, credentials);
    return { catalogId, handles: res.handles ?? [] };
};

export const updateMetaProduct = async (metaProductId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await metaRequest("POST", `/${metaProductId}`, {
        name: product.name,
        description: product.description ?? "",
        price: Math.round(basePrice * 100),
        currency: "USD",
    }, credentials);
    return { id: metaProductId };
};
