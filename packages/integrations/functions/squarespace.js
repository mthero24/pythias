import axios from "axios";

const BASE_URL = "https://api.squarespace.com/1.0";

const sqRequest = async (method, path, data, credentials) => {
    const headers = {
        "Authorization": `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Pythias/1.0",
    };
    try {
        const res = await axios({
            method,
            url: `${BASE_URL}${path}`,
            headers,
            ...(method === "GET" ? { params: data } : { data }),
        });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.message ?? e.response?.data?.type ?? e.message;
        throw new Error(`Squarespace ${method.toUpperCase()} ${path}: ${msg}`);
    }
};

export const createSquarespaceProduct = async (product, credentials) => {
    const toCents = (price) => String(Math.round(parseFloat(price ?? 0) * 100));

    const variants = product.variantsArray.map(v => {
        const sizeObj = product.sizes?.find(s => s._id?.toLowerCase() === v.size?.toLowerCase());
        const sizeVal  = sizeObj?.name ?? v.size ?? "";
        const colorVal = v.color?.name ?? "";
        const attributes = {};
        if (colorVal) attributes["Color"] = colorVal;
        if (sizeVal)  attributes["Size"]  = sizeVal;
        return {
            sku: v.sku ?? "",
            priceMoney: { amount: toCents(v.price), currency: "USD" },
            ...(Object.keys(attributes).length ? { attributes } : {}),
        };
    });

    const payload = {
        type: "PHYSICAL",
        name: product.name,
        description: product.description ?? "",
        variants,
    };

    const res = await sqRequest("POST", "/commerce/products", payload, credentials);
    return res;
};

export const updateSquarespaceProduct = async (sqProductId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await sqRequest("PUT", `/commerce/products/${sqProductId}`, {
        name: product.name,
        description: product.description ?? "",
        variants: product.variantsArray.map(v => ({
            sku: v.sku ?? "",
            priceMoney: { amount: String(Math.round((parseFloat(v.price ?? basePrice ?? 0)) * 100)), currency: "USD" },
        })),
    }, credentials);
    return { id: sqProductId };
};

export const getSquarespaceOrders = async (credentials, cursor) => {
    const params = cursor
        ? { fulfillmentStatus: "PENDING", cursor }
        : { fulfillmentStatus: "PENDING" };
    return await sqRequest("GET", "/commerce/orders", params, credentials);
};
