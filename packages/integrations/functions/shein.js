import { createHmac } from "crypto";
import axios from "axios";

const BASE = "https://openapi.sheincorp.com";

export function sheinHeaders(openKeyId, secretKey) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", secretKey)
        .update(openKeyId + timestamp)
        .digest("hex");
    return {
        "x-lt-openKeyId": openKeyId,
        "x-lt-timestamp": timestamp,
        "x-lt-signature": signature,
        "Content-Type": "application/json",
        "language": "en",
    };
}

export async function sheinRequest({ openKeyId, secretKey, path, data }) {
    try {
        const res = await axios.post(`${BASE}${path}`, data, { headers: sheinHeaders(openKeyId, secretKey) });
        return { data: res.data };
    } catch (e) {
        const detail = e.response?.data ?? e.message;
        console.error(`SHEIN POST ${path} error:`, detail);
        return { error: detail };
    }
}

export async function convertImageShein({ openKeyId, secretKey, url }) {
    const result = await sheinRequest({
        openKeyId, secretKey,
        path: "/open-api/goods/transform-pic",
        data: { url, type: 1 },
    });
    if (result.error || result.data?.code !== "0") return null;
    return result.data?.data?.image_url ?? null;
}

export async function getOrdersShein({ openKeyId, secretKey, status = "unshipped", page = 1, pageSize = 50 }) {
    const { data, error } = await sheinRequest({
        openKeyId, secretKey,
        path: "/open-api/orders/query",
        data: { order_status: status, page_no: page, page_size: pageSize },
    });
    if (error) return { error };
    if (data?.code !== "0") return { error: data };
    return { orders: data?.data?.order_list ?? [], total: data?.data?.total ?? 0 };
}

export async function shipOrderShein({ openKeyId, secretKey, orderId, carrierCode, trackingNumber }) {
    const { data, error } = await sheinRequest({
        openKeyId, secretKey,
        path: "/open-api/orders/trackingNumber",
        data: { order_no: orderId, carrier_code: carrierCode, tracking_number: trackingNumber },
    });
    if (error) return { error };
    if (data?.code !== "0") return { error: data };
    return { success: true, data };
}
