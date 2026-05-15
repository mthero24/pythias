import axios from "axios";
import { randomUUID } from "crypto";

const BASE = "https://marketplace.walmartapis.com/v3";

const walmartHeaders = (token, partnerId, extra = {}) => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    "WM_SEC.ACCESS_TOKEN": token,
    "WM_PARTNER.ID": partnerId,
    "WM_QOS.CORRELATION_ID": randomUUID(),
    "WM_SVC.NAME": "Walmart Marketplace",
    ...extra,
});

const getTokenWalmart = async ({ clientId, clientSecret, partnerId }) => {
    const params = new URLSearchParams({ grant_type: "client_credentials" });
    let errorRes;
    const res = await axios.post(`${BASE}/token`, params.toString(), {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "WM_PARTNER.ID": partnerId,
            "WM_QOS.CORRELATION_ID": randomUUID(),
            "WM_SVC.NAME": "Walmart Marketplace",
        },
        auth: { username: clientId, password: clientSecret },
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) { console.error("Walmart token error:", errorRes); return null; }
    return res?.data?.access_token ?? null;
};

export const getItemsWalmart = async ({ clientId, clientSecret, partnerId, params }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return null;
    const searchParams = new URLSearchParams(params ?? {}).toString();
    let errorRes;
    const res = await axios.get(`${BASE}/items${searchParams ? `?${searchParams}` : ""}`, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return null;
    return res?.data?.ItemResponse ?? null;
};

export const retireItemWalmart = async ({ clientId, clientSecret, partnerId, sku }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return null;
    let errorRes;
    const res = await axios.delete(`${BASE}/items/${sku}`, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return null;
    return res?.data ?? null;
};

export const bulkUploadWalmart = async ({ clientId, clientSecret, partnerId, type, payload }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return { error: "Failed to get Walmart token" };
    const jsonBuffer = Buffer.from(JSON.stringify(payload));
    const boundary = `----WalmartBoundary${Date.now()}`;
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="items.json"\r\nContent-Type: application/json\r\n\r\n`),
        jsonBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    let errorRes;
    const res = await axios.post(`${BASE}/feeds?feedType=${type}`, body, {
        headers: {
            ...walmartHeaders(token, partnerId),
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return { error: errorRes };
    return { feedId: res?.data?.feedId };
};

export const getSpecWalmart = async ({ clientId, clientSecret, partnerId, type }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return null;
    let errorRes;
    const res = await axios.post(`${BASE}/items/spec`, {
        feedType: "MP_ITEM",
        version: "2.0.20240126-12_25_52-api",
        productTypes: [type],
    }, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return null;
    return res?.data ?? null;
};

export const getFeedWalmart = async ({ clientId, clientSecret, partnerId, feedId }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return { error: "Failed to get Walmart token" };
    let errorRes;
    const res = await axios.get(`${BASE}/feeds/${feedId}`, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return { error: errorRes };
    return res?.data ?? null;
};

export const getOrdersWalmart = async ({ clientId, clientSecret, partnerId, createdStartDate, limit = 100, nextCursor }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return { error: "Failed to get Walmart token" };
    const params = new URLSearchParams({ limit: Math.min(limit, 100) });
    if (createdStartDate) params.set("createdStartDate", createdStartDate);
    if (nextCursor) params.set("nextCursor", nextCursor);
    let errorRes;
    const res = await axios.get(`${BASE}/orders?${params}`, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return { error: errorRes };
    const data = res?.data ?? {};
    return {
        orders: data.elements?.order ?? [],
        nextCursor: data.meta?.nextCursor ?? null,
        hasMore: data.meta?.hasMoreElements ?? false,
        total: data.meta?.totalCount ?? 0,
    };
};

export const acknowledgeOrderWalmart = async ({ clientId, clientSecret, partnerId, purchaseOrderId }) => {
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return { error: "Failed to get Walmart token" };
    let errorRes;
    const res = await axios.post(`${BASE}/orders/${purchaseOrderId}/acknowledge`, {}, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return { error: errorRes };
    return { success: true };
};

export const shipOrderWalmart = async ({ clientId, clientSecret, partnerId, purchaseOrderId, lines }) => {
    // lines: [{ lineNumber, quantity, trackingNumber, carrier, shipDateTime }]
    const token = await getTokenWalmart({ clientId, clientSecret, partnerId });
    if (!token) return { error: "Failed to get Walmart token" };
    const payload = {
        orderShipment: [{
            orderLines: {
                orderLine: lines.map(l => ({
                    lineNumber: l.lineNumber,
                    orderLineStatuses: {
                        orderLineStatus: [{
                            status: "Shipped",
                            statusQuantity: l.quantity ?? 1,
                            trackingInfo: {
                                shipDateTime: l.shipDateTime ?? new Date().toISOString(),
                                carrierName: { carrier: l.carrier ?? "USPS" },
                                trackingNumber: l.trackingNumber,
                                methodCode: l.methodCode ?? "Standard",
                            },
                        }],
                    },
                })),
            },
        }],
    };
    let errorRes;
    const res = await axios.post(`${BASE}/orders/${purchaseOrderId}/shipping`, payload, {
        headers: walmartHeaders(token, partnerId),
    }).catch(e => { errorRes = e.response?.data ?? e.message });
    if (errorRes) return { error: errorRes };
    return { success: true };
};
