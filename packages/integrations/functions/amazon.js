const SP_API_BASE = "https://sellingpartnerapi-na.amazon.com";
const LWA_URL     = "https://api.amazon.com/auth/o2/token";

export async function getAmazonAccessToken({ clientId, clientSecret, refreshToken }) {
    const res = await fetch(LWA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type:    "refresh_token",
            refresh_token: refreshToken,
            client_id:     clientId,
            client_secret: clientSecret,
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        return { error: data.error_description ?? data.error ?? "Failed to get access token" };
    }
    return { accessToken: data.access_token };
}

export async function getOrdersAmazon({ clientId, clientSecret, refreshToken, marketplaceId, statuses, createdAfter, nextToken }) {
    const { accessToken, error } = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (error) return { error };

    const params = new URLSearchParams({
        MarketplaceIds: marketplaceId || "ATVPDKIKX0DER",
        OrderStatuses:  (statuses || ["Unshipped", "PartiallyShipped"]).join(","),
    });
    if (createdAfter) params.set("CreatedAfter", createdAfter);
    if (nextToken)    params.set("NextToken", nextToken);

    const res = await fetch(`${SP_API_BASE}/orders/v0/orders?${params}`, {
        headers: { "x-amz-access-token": accessToken },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.errors?.[0]?.message ?? "Failed to get orders", detail: data };
    return { orders: data.payload?.Orders ?? [], nextToken: data.payload?.NextToken };
}

export async function getOrderItemsAmazon({ clientId, clientSecret, refreshToken, orderId }) {
    const { accessToken, error } = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (error) return { error };

    const res = await fetch(`${SP_API_BASE}/orders/v0/orders/${orderId}/orderItems`, {
        headers: { "x-amz-access-token": accessToken },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.errors?.[0]?.message ?? "Failed to get order items" };
    return { orderItems: data.payload?.OrderItems ?? [], nextToken: data.payload?.NextToken };
}

export async function confirmShipmentAmazon({ clientId, clientSecret, refreshToken, orderId, marketplaceId, packageDetail }) {
    const { accessToken, error } = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (error) return { error };

    const res = await fetch(`${SP_API_BASE}/orders/v0/orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "x-amz-access-token": accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({
            marketplaceId: marketplaceId || "ATVPDKIKX0DER",
            packageDetail,
        }),
    });
    if (res.status === 204 || res.ok) return { success: true };
    const data = await res.json().catch(() => ({}));
    return { error: data?.errors?.[0]?.message ?? "Failed to confirm shipment", detail: data };
}

export async function createListingAmazon({ clientId, clientSecret, refreshToken, sellerId, marketplaceId, sku, productType, attributes }) {
    const { accessToken, error } = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (error) return { error };

    const params = new URLSearchParams({ marketplaceIds: marketplaceId || "ATVPDKIKX0DER" });
    const res = await fetch(`${SP_API_BASE}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}?${params}`, {
        method: "PUT",
        headers: { "x-amz-access-token": accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({ productType, attributes }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.errors?.[0]?.message ?? data?.issues?.[0]?.message ?? "Listing failed", detail: data };
    return { status: data.status, issues: data.issues ?? [] };
}

export async function getCatalogItemsAmazon({ clientId, clientSecret, refreshToken, sellerId, marketplaceId, keywords, identifiers, identifiersType, pageToken }) {
    const { accessToken, error } = await getAmazonAccessToken({ clientId, clientSecret, refreshToken });
    if (error) return { error };

    const params = new URLSearchParams({
        marketplaceIds: marketplaceId || "ATVPDKIKX0DER",
        includedData: "summaries,identifiers",
    });
    // sellerId only required when identifiersType=SKU; keywords and identifiers are mutually exclusive
    if (keywords) params.set("keywords", keywords);
    if (identifiers) {
        params.set("identifiers", identifiers);
        params.set("identifiersType", identifiersType ?? "ASIN");
        if (identifiersType === "SKU" && sellerId) params.set("sellerId", sellerId);
    }
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${SP_API_BASE}/catalog/2022-04-01/items?${params}`, {
        headers: { "x-amz-access-token": accessToken },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.errors?.[0]?.message ?? "Failed to get catalog", detail: data };
    return { items: data.items ?? [], nextToken: data.pagination?.nextToken };
}
