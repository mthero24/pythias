import axios from "axios";

const BASE_URL = "https://api.onbuy.com/v2";

// OnBuy uses a token exchange — POST consumer_key + secret_key → 15-min access token
const getOnBuyToken = async (credentials) => {
    const res = await axios.post(`${BASE_URL}/auth/request_token`, new URLSearchParams({
        consumer_key: credentials.apiKey,
        secret_key: credentials.apiSecret,
    }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    return res.data.access_token;
};

const onbuyRequest = async (method, path, data, credentials) => {
    const token = await getOnBuyToken(credentials);
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
        const msg = e.response?.data?.message ?? e.response?.data?.error ?? e.message;
        throw new Error(`OnBuy API ${method} ${path}: ${msg}`);
    }
};

export const getOnBuyOrders = async (credentials, offset = 0) => {
    const res = await onbuyRequest("GET", "/orders", {
        status: "awaiting_dispatch",
        limit: 100,
        offset,
    }, credentials);
    return {
        orders: res.results ?? [],
        total: res.total ?? 0,
    };
};

export const createOnBuyListing = async (product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const listings = product.variantsArray.map(v => ({
        sku: v.sku,
        name: product.name,
        description: product.description ?? "",
        price: parseFloat(v.price ?? basePrice ?? 0),
        stock: 999,
        site_id: 2000, // UK site
        condition: "New",
    }));
    const res = await onbuyRequest("POST", "/products", { listings }, credentials);
    return { listings: res.results ?? [] };
};

export const updateOnBuyListing = async (onbuyListingId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await onbuyRequest("PUT", `/listings/${onbuyListingId}`, {
        name: product.name,
        description: product.description ?? "",
        price: basePrice,
    }, credentials);
    return { id: onbuyListingId };
};
