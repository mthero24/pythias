import axios from "axios";

const BASE_URL = "https://api.channeladvisor.com/v1";
const TOKEN_URL = "https://api.channeladvisor.com/oauth2/token";

// client_id + client_secret are app-level (Pythias dev app credentials from env)
// refresh_token is per-seller, stored in credentials.apiKey
const getRithumToken = async (refreshToken) => {
    const res = await axios.post(TOKEN_URL, new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.rathumDevKey,
        client_secret: process.env.rathumDevSecret ?? "",
    }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    return res.data.access_token;
};

const rithumRequest = async (method, path, data, credentials) => {
    const token = await getRithumToken(credentials.apiKey);
    try {
        const res = await axios({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            ...(method === "GET" ? { params: data } : { data }),
        });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.Message ?? e.response?.data?.message ?? e.response?.data?.error ?? e.message;
        throw new Error(`Rithum API ${method} ${path}: ${msg}`);
    }
};

export const getRithumOrders = async (credentials, skip = 0) => {
    const res = await rithumRequest("GET", "/Orders", {
        "$filter": "OrderStatus eq 'PendingShipment'",
        "$top": 100,
        "$skip": skip,
        "$expand": "Items",
    }, credentials);
    return {
        orders: res.value ?? [],
        hasMore: (res.value?.length ?? 0) === 100,
    };
};

export const shipRithumOrder = async (orderId, shipment, credentials) => {
    await rithumRequest("PATCH", `/Orders(${orderId})`, {
        ShippingStatus: "Shipped",
        ShippingCarrier: shipment.carrier ?? "Other",
        TrackingNumber: shipment.trackingNumber,
    }, credentials);
};

export const createRithumProduct = async (product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const res = await rithumRequest("POST", "/Products", {
        Sku: product.variantsArray[0]?.sku ?? product.name,
        Title: product.name,
        Description: product.description ?? "",
        Price: basePrice,
        Quantity: 999,
        IsExternalProductIdRequired: false,
    }, credentials);
    return { productId: res.ID ?? res.id ?? null };
};

export const updateRithumProduct = async (productId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await rithumRequest("PATCH", `/Products(${productId})`, {
        Title: product.name,
        Description: product.description ?? "",
        Price: basePrice,
    }, credentials);
    return { productId };
};
