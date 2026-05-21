import axios from "axios";

const API_BASE  = "https://api.ebay.com";
const AUTH_URL  = "https://api.ebay.com/identity/v1/oauth2/token";
const AUTH_PAGE = "https://auth.ebay.com/oauth2/authorize";

const SCOPES = [
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
].join(" ");

const CARRIER_MAP = {
    usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL_EXPRESS_1_2_DAYS",
    ontrac: "ONTRAC", lasership: "LASERSHIP", amazon: "AMAZON_LOGISTICS_US",
};

function basicAuth() {
    const id  = process.env.ebayClientId;
    const sec = process.env.ebayClientSecret;
    return Buffer.from(`${id}:${sec}`).toString("base64");
}

// ─── Token management ─────────────────────────────────────────────────────────

export async function refreshEbayToken(connection) {
    const res = await axios.post(
        AUTH_URL,
        new URLSearchParams({ grant_type: "refresh_token", refresh_token: connection.refreshToken, scope: SCOPES }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth()}` } }
    );
    return res.data; // { access_token, expires_in, token_type }
}

async function ensureFreshToken(connection) {
    try {
        const data = await refreshEbayToken(connection);
        connection.apiKey       = data.access_token;
        if (data.refresh_token) connection.refreshToken = data.refresh_token;
        await connection.save();
        return data.access_token;
    } catch (e) {
        console.error("[eBay] token refresh failed:", e.response?.data ?? e.message);
        throw e;
    }
}

// Exchange authorization code for tokens (OAuth flow)
// eBay requires the RuName (not the actual URL) as redirect_uri in both the
// authorize URL and the token-exchange call.
export async function exchangeCodeEbay(code) {
    const res = await axios.post(
        AUTH_URL,
        new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.ebayRuName }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth()}` } }
    );
    return res.data; // { access_token, refresh_token, expires_in }
}

export function generateEbayAuthUrl(redirectUri, state = "") {
    const params = new URLSearchParams({
        client_id:     process.env.ebayClientId,
        response_type: "code",
        redirect_uri:  process.env.ebayRuName ?? redirectUri,
        scope:         SCOPES,
        state,
    });
    return `${AUTH_PAGE}?${params.toString()}`;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersEbay(connection) {
    const token = await ensureFreshToken(connection);
    try {
        const res = await axios.get(`${API_BASE}/sell/fulfillment/v1/order`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { filter: "orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}", limit: 50 },
        });
        return res.data?.orders ?? [];
    } catch (e) {
        console.error("[eBay] getOrders error:", e.response?.data ?? e.message);
        throw e;
    }
}

export async function shipOrderEbay(connection, orderId, { trackingNumber, carrier, lineItemIds }) {
    const token = await ensureFreshToken(connection);
    const shippingCarrierCode = CARRIER_MAP[carrier?.toLowerCase()] ?? "OTHER";
    const body = {
        lineItems:           (lineItemIds ?? []).map(id => ({ lineItemId: id })),
        shippedDate:         new Date().toISOString(),
        shippingCarrierCode,
        trackingNumber,
    };
    try {
        const res = await axios.post(
            `${API_BASE}/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
            body,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        return res.data ?? { ok: true };
    } catch (e) {
        console.error("[eBay] shipOrder error:", e.response?.data ?? e.message);
        throw e;
    }
}

// ─── Inventory / Listings ─────────────────────────────────────────────────────

export async function createInventoryItemEbay(connection, sku, { title, description, condition = "NEW", quantity = 9999, imageUrls = [], aspects = {} }) {
    const token = await ensureFreshToken(connection);
    const body = {
        availability: { shipToLocationAvailability: { quantity } },
        condition,
        product: { title, description, aspects, imageUrls },
    };
    try {
        const res = await axios.put(
            `${API_BASE}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
            body,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
        );
        return res.data ?? { ok: true };
    } catch (e) {
        console.error("[eBay] createInventoryItem error:", e.response?.data ?? e.message);
        throw e;
    }
}

export async function createOfferEbay(connection, { sku, categoryId, listingDescription, price, fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey, publish = true }) {
    const token = await ensureFreshToken(connection);
    const body = {
        sku,
        marketplaceId:     "EBAY_US",
        format:            "FIXED_PRICE",
        availableQuantity: 9999,
        categoryId,
        listingDescription,
        listingPolicies: { fulfillmentPolicyId, paymentPolicyId, returnPolicyId },
        merchantLocationKey,
        pricingSummary: { price: { currency: "USD", value: String(price) } },
    };
    const res = await axios.post(
        `${API_BASE}/sell/inventory/v1/offer`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    const offerId = res.data?.offerId;
    if (publish && offerId) {
        await axios.post(
            `${API_BASE}/sell/inventory/v1/offer/${offerId}/publish`,
            {},
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    }
    return { offerId, ...res.data };
}

export async function getAccountPoliciesEbay(connection) {
    const token = await ensureFreshToken(connection);
    const headers = { Authorization: `Bearer ${token}` };
    const [fulfill, payment, ret] = await Promise.all([
        axios.get(`${API_BASE}/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US`, { headers }).catch(() => ({ data: { fulfillmentPolicies: [] } })),
        axios.get(`${API_BASE}/sell/account/v1/payment_policy?marketplace_id=EBAY_US`,     { headers }).catch(() => ({ data: { paymentPolicies: [] } })),
        axios.get(`${API_BASE}/sell/account/v1/return_policy?marketplace_id=EBAY_US`,      { headers }).catch(() => ({ data: { returnPolicies: [] } })),
    ]);
    return {
        fulfillmentPolicies: fulfill.data.fulfillmentPolicies ?? [],
        paymentPolicies:     payment.data.paymentPolicies    ?? [],
        returnPolicies:      ret.data.returnPolicies          ?? [],
    };
}
