import axios from "axios";

// baseUrl is the marketplace root, e.g. "https://marketplace.target.com"
// apiKey  is stored in ApiKeyIntegrations.apiKey
// organization is used as baseUrl in ApiKeyIntegrations

const miraklRequest = async ({ apiKey, baseUrl, method = "get", path, params, data }) => {
    const url = `${String(baseUrl).replace(/\/$/, "")}${path}`;
    const headers = {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    try {
        const res = await axios({ method, url, params, data, headers });
        return { data: res.data };
    } catch (e) {
        const detail = e.response?.data ?? e.message;
        console.error(`Mirakl ${method.toUpperCase()} ${path} error:`, detail);
        return { error: detail };
    }
};

// GET /api/orders
// orderStates: comma-separated, e.g. "WAITING_ACCEPTANCE,WAITING_DEBIT"
export const getOrdersMirakl = async ({ apiKey, baseUrl, orderStates, start = 0, max = 100, startDate, endDate }) => {
    const params = { max, start };
    if (orderStates) params.order_states = orderStates;
    if (startDate)   params.start_date   = startDate;
    if (endDate)     params.end_date     = endDate;

    const { data, error } = await miraklRequest({ apiKey, baseUrl, path: "/api/orders", params });
    if (error) return { error };
    return { orders: data?.orders ?? [], total: data?.total_count ?? 0 };
};

// GET /api/orders/{orderId}
export const getOrderMirakl = async ({ apiKey, baseUrl, orderId }) => {
    const { data, error } = await miraklRequest({ apiKey, baseUrl, path: `/api/orders/${orderId}` });
    if (error) return { error };
    return { order: data };
};

// PUT /api/orders/{orderId}/accept — accept a single order (moves to WAITING_DEBIT)
export const acceptOrderMirakl = async ({ apiKey, baseUrl, orderId }) => {
    const { data, error } = await miraklRequest({
        apiKey, baseUrl, method: "put", path: `/api/orders/${orderId}/accept`,
    });
    if (error) return { error };
    return { data };
};

// PUT /api/orders/{orderId}/tracking — submit tracking for one order
// carrier: string carrier code (e.g. "UPS", "USPS", "FEDEX")
// trackingNumber: string
// shippingDate: ISO string (defaults to now)
export const shipOrderMirakl = async ({ apiKey, baseUrl, orderId, carrier, carrierName, trackingNumber, trackingUrl, shippingDate }) => {
    const body = {
        tracking_number: trackingNumber,
        carrier_code:    carrier,
        carrier_name:    carrierName ?? carrier,
        shipping_date:   shippingDate ?? new Date().toISOString(),
    };
    if (trackingUrl) body.carrier_url = trackingUrl;

    const { data, error } = await miraklRequest({
        apiKey, baseUrl, method: "put", path: `/api/orders/${orderId}/tracking`, data: body,
    });
    if (error) return { error };
    return { data };
};

// PUT /api/orders/{orderId}/cancel — cancel an order
export const cancelOrderMirakl = async ({ apiKey, baseUrl, orderId, reasonCode = "35" }) => {
    const { data, error } = await miraklRequest({
        apiKey, baseUrl, method: "put",
        path: `/api/orders/${orderId}/cancel`,
        data: { reason_code: reasonCode },
    });
    if (error) return { error };
    return { data };
};

// GET /api/offers — list seller offers/products
export const getOffersMirakl = async ({ apiKey, baseUrl, start = 0, max = 100, skus }) => {
    const params = { max, start };
    if (skus) params.product_sku = skus;

    const { data, error } = await miraklRequest({ apiKey, baseUrl, path: "/api/offers", params });
    if (error) return { error };
    return { offers: data?.offers ?? [], total: data?.total_count ?? 0 };
};
