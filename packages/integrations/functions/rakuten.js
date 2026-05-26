import axios from "axios";

// Rakuten Ichiba RMS API v2.0 (Japan marketplace)
// Auth: ESA base64(serviceSecret:licenseKey) — serviceSecret stored in apiKey, licenseKey in apiSecret
const BASE_URL = "https://api.rms.rakuten.co.jp/es";

const rakutenRequest = async (method, path, data, credentials) => {
    const token = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64");
    try {
        const res = await axios({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                "Authorization": `ESA ${token}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            ...(method === "GET" ? { params: data } : { data }),
        });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.message_model_list?.[0]?.message ?? e.message;
        throw new Error(`Rakuten RMS ${method} ${path}: ${msg}`);
    }
};

export const getRakutenOrders = async (credentials) => {
    const now = new Date();
    const startDatetime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
    const endDatetime = now.toISOString().replace("T", " ").slice(0, 19);
    // searchOrder uses POST
    const res = await rakutenRequest("POST", "/2.0/order/searchOrder/", {
        dateType: 1, // 1 = order date
        startDatetime,
        endDatetime,
        orderProgressList: [200, 300], // 200 = waiting shipment, 300 = shipped
        PaginationRequestModel: { requestRecordsAmount: 100, requestPage: 1 },
    }, credentials);
    return { orders: res.order_model_list ?? [] };
};

export const createRakutenItem = async (product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const res = await rakutenRequest("POST", "/1.0/item/insert/", {
        itemModel: {
            manageNumber: product.variantsArray[0]?.sku ?? product._id?.toString(),
            itemName: product.name,
            itemCaption: product.description ?? "",
            itemPrice: Math.round(basePrice),
            itemNumber: product.variantsArray[0]?.sku ?? "",
        },
    }, credentials);
    return {
        itemUrl: res.itemModel?.itemUrl,
        manageNumber: res.itemModel?.manageNumber,
    };
};

export const updateRakutenItem = async (manageNumber, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await rakutenRequest("POST", "/1.0/item/update/", {
        itemModel: {
            manageNumber,
            itemName: product.name,
            itemCaption: product.description ?? "",
            itemPrice: Math.round(basePrice),
        },
    }, credentials);
    return { id: manageNumber };
};
