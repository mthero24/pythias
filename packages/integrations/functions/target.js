const TARGET_API = "https://api.target.com/seller_orders/v1";

function targetHeaders({ apiKey, sellerId, sellerToken }) {
    return {
        "x-api-key":      apiKey,
        "x-seller-id":    sellerId,
        "x-seller-token": sellerToken,
        "Content-Type":   "application/json",
    };
}

export async function testTargetConnection({ apiKey, sellerId, sellerToken }) {
    const res = await fetch(`${TARGET_API}/shipping_methods?per_page=1`, {
        headers: targetHeaders({ apiKey, sellerId, sellerToken }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data?.message ?? data?.errors?.[0] ?? "Connection failed" };
    }
    return { ok: true };
}

export async function getOrdersTarget({ apiKey, sellerId, sellerToken, statuses, page, perPage }) {
    const params = new URLSearchParams({
        per_page: String(perPage || 50),
        page:     String(page || 1),
    });
    (statuses || ["RELEASED_FOR_SHIPMENT", "ACKNOWLEDGED_BY_SELLER"]).forEach(s =>
        params.append("order_status", s)
    );

    const res = await fetch(`${TARGET_API}/sellers/${sellerId}/orders?${params}`, {
        headers: targetHeaders({ apiKey, sellerId, sellerToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.message ?? data?.errors?.[0] ?? "Failed to get orders" };
    return { orders: Array.isArray(data) ? data : [] };
}

export async function acknowledgeOrderTarget({ apiKey, sellerId, sellerToken, orderId }) {
    const res = await fetch(`${TARGET_API}/sellers/${sellerId}/order_statuses/${orderId}`, {
        method: "PUT",
        headers: targetHeaders({ apiKey, sellerId, sellerToken }),
        body: JSON.stringify({ status: "ACKNOWLEDGED_BY_SELLER" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.message ?? data?.errors?.[0] ?? "Acknowledge failed" };
    return { success: true };
}

export async function shipOrderTarget({ apiKey, sellerId, sellerToken, orderId, items }) {
    // items: [{ order_line_number, quantity, shipped_date, shipping_method, tracking_number }]
    const res = await fetch(`${TARGET_API}/sellers/${sellerId}/orders/${orderId}/bulk_fulfillments_create`, {
        method: "POST",
        headers: targetHeaders({ apiKey, sellerId, sellerToken }),
        body: JSON.stringify({ items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.message ?? data?.errors?.[0] ?? "Fulfillment failed" };
    return { results: data.results ?? [] };
}

export async function getShippingMethodsTarget({ apiKey, sellerId, sellerToken }) {
    const res = await fetch(`${TARGET_API}/shipping_methods?per_page=100`, {
        headers: targetHeaders({ apiKey, sellerId, sellerToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { methods: [] };
    return { methods: Array.isArray(data) ? data : [] };
}
