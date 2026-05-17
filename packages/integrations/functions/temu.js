import { createHash } from "crypto";
import axios from "axios";

const BASE = "https://openapi-b-us.temu.com/openapi/router";

export function temuSign(params, appSecret) {
    const str = appSecret + Object.keys(params).sort().map(k => `${k}${params[k]}`).join("") + appSecret;
    return createHash("md5").update(str).digest("hex").toUpperCase();
}

export async function temuRequest({ appKey, appSecret, accessToken, type, data }) {
    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const dataStr = JSON.stringify(data);

        const params = {
            type,
            app_key: appKey,
            access_token: accessToken,
            timestamp,
            data_type: "JSON",
            data: dataStr,
        };
        params.sign = temuSign(params, appSecret);

        const res = await axios.post(BASE, params, { headers: { "Content-Type": "application/json" } });
        return { data: res.data };
    } catch (e) {
        const detail = e.response?.data ?? e.message;
        console.error(`TEMU ${type} error:`, detail);
        return { error: detail };
    }
}

export async function uploadImageTemu({ appKey, appSecret, accessToken, fileUrl }) {
    const result = await temuRequest({
        appKey, appSecret, accessToken,
        type: "temu.local.goods.image.v2.upload",
        data: { fileUrl },
    });
    if (result.error || result.data?.errorCode !== 1000000) return null;
    return result.data?.result?.imageUrl ?? null;
}

export async function addProductTemu({ appKey, appSecret, accessToken, payload }) {
    const existingGoodsId = payload.goodsId;
    const type = existingGoodsId ? "temu.local.goods.v2.edit" : "temu.local.goods.v2.add";
    const { data, error } = await temuRequest({ appKey, appSecret, accessToken, type, data: payload });
    if (error) return { error };
    if (data?.errorCode !== 1000000) return { error: data };
    return { goodsId: data?.result?.goodsId ?? existingGoodsId, result: data?.result };
}

export async function getOrdersTemu({ appKey, appSecret, accessToken, orderStatus = 1, pageNo = 1, pageSize = 50 }) {
    const { data, error } = await temuRequest({
        appKey, appSecret, accessToken,
        type: "temu.order.goods.page.get",
        data: { orderStatus, pageNo, pageSize },
    });
    if (error) return { error };
    if (data?.errorCode !== 1000000) return { error: data };
    const result = data?.result ?? {};
    return { orders: result.orderList ?? result.order_list ?? [], total: result.total ?? 0 };
}

export async function shipOrderTemu({ appKey, appSecret, accessToken, orderSn, carrierCode, trackingNumber }) {
    const { data, error } = await temuRequest({
        appKey, appSecret, accessToken,
        type: "temu.order.goods.deliver.create",
        data: { orderSn, carrierCode, trackingNumber },
    });
    if (error) return { error };
    if (data?.errorCode !== 1000000) return { error: data };
    return { success: true, data: data?.result };
}
