import axios from "axios";

const API_BASE          = "https://api.ebay.com";
const API_BASE_SANDBOX  = "https://api.sandbox.ebay.com";
const AUTH_URL          = "https://api.ebay.com/identity/v1/oauth2/token";
const AUTH_URL_SANDBOX  = "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
const AUTH_PAGE         = "https://auth.ebay.com/oauth2/authorize";
const AUTH_PAGE_SANDBOX = "https://auth.sandbox.ebay.com/oauth2/authorize";

// Core scopes — always request these. Every scope here must be enabled
// in the eBay developer portal for both prod and sandbox apps.
const SCOPES_CORE = [
    "https://api.ebay.com/oauth/api_scope",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.finances",
    "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.marketing",
    "https://api.ebay.com/oauth/api_scope/sell.payment.dispute",
    "https://api.ebay.com/oauth/api_scope/sell.reputation",
    "https://api.ebay.com/oauth/api_scope/sell.stores",
    "https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
    "https://api.ebay.com/oauth/api_scope/commerce.message",
    "https://api.ebay.com/oauth/api_scope/commerce.feedback",
];

const SCOPES = SCOPES_CORE.join(" ");

const CARRIER_MAP = {
    usps: "USPS", ups: "UPS", fedex: "FedEx", dhl: "DHL_EXPRESS_1_2_DAYS",
    ontrac: "ONTRAC", lasership: "LASERSHIP", amazon: "AMAZON_LOGISTICS_US",
};

function basicAuth(sandbox = false) {
    const id  = sandbox ? process.env.ebayClientIdSandbox  : process.env.ebayClientId;
    const sec = sandbox ? process.env.ebayClientSecretSandbox : process.env.ebayClientSecret;
    return Buffer.from(`${id}:${sec}`).toString("base64");
}

function base(connection) {
    return connection?.sandbox ? API_BASE_SANDBOX : API_BASE;
}

// ─── Token management ─────────────────────────────────────────────────────────

export async function refreshEbayToken(connection) {
    const sandbox = !!connection?.sandbox;
    const res = await axios.post(
        sandbox ? AUTH_URL_SANDBOX : AUTH_URL,
        new URLSearchParams({ grant_type: "refresh_token", refresh_token: connection.refreshToken, scope: SCOPES }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth(sandbox)}` } }
    );
    return res.data;
}

async function ensureFreshToken(connection) {
    try {
        const data = await refreshEbayToken(connection);
        connection.apiKey = data.access_token;
        if (data.refresh_token) connection.refreshToken = data.refresh_token;
        await connection.save();
        return data.access_token;
    } catch (e) {
        console.error("[eBay] token refresh failed:", e.response?.data ?? e.message);
        throw e;
    }
}

export async function exchangeCodeEbay(code, { sandbox = false } = {}) {
    const ruName = sandbox ? process.env.ebayRuNameSandbox : process.env.ebayRuName;
    const res = await axios.post(
        sandbox ? AUTH_URL_SANDBOX : AUTH_URL,
        new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: ruName }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth(sandbox)}` } }
    );
    return res.data;
}

export function generateEbayAuthUrl(redirectUri, state = "", { sandbox = false } = {}) {
    const authPage = sandbox ? AUTH_PAGE_SANDBOX : AUTH_PAGE;
    const clientId = sandbox ? process.env.ebayClientIdSandbox : process.env.ebayClientId;
    const ruName   = sandbox ? process.env.ebayRuNameSandbox   : process.env.ebayRuName;
    const params = new URLSearchParams({
        client_id:     clientId,
        response_type: "code",
        redirect_uri:  ruName ?? redirectUri,
        scope:         SCOPES,
        state,
    });
    return `${authPage}?${params.toString()}`;
}

// ─── Identity ─────────────────────────────────────────────────────────────────

export async function getSellerIdentityEbay(connection) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/commerce/identity/v1/user/`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(e => {
        console.error("[eBay] getSellerIdentity status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: null };
    });
    return res.data;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrdersEbay(connection) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/fulfillment/v1/order`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filter: "orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}", limit: 50 },
    }).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data?.orders ?? [];
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
    const res = await axios.post(
        `${base(connection)}/sell/fulfillment/v1/order/${encodeURIComponent(orderId)}/shipping_fulfillment`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
}

// Strip non-alphanumeric chars and truncate to eBay's 50-char SKU limit
function sanitizeEbaySku(sku) {
    return String(sku).replace(/[^a-zA-Z0-9]/g, "").slice(0, 50);
}

// ─── Inventory / Listings ─────────────────────────────────────────────────────

export async function getInventoryItemsEbay(connection, { limit = 50, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/inventory/v1/inventory_item`, {
        headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en-US" },
        params: { limit, offset },
    }).catch(e => {
        const body = e.response?.data;
        const err  = body?.errors?.[0];
        // errorId 25001 is eBay's generic sandbox internal error for inventory listing —
        // the items exist but the list endpoint is unreliable; return empty gracefully
        if (err?.errorId === 25001) return { data: { inventoryItems: [], total: 0 } };
        throw new Error(err?.longMessage ?? err?.message ?? e.message);
    });
    return { items: res.data?.inventoryItems ?? [], total: res.data?.total ?? 0 };
}

export async function getOffersEbay(connection, { sku, limit = 50, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const params = { limit, offset };
    if (sku) params.sku = sanitizeEbaySku(sku);
    const res = await axios.get(`${base(connection)}/sell/inventory/v1/offer`, {
        headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en-US" },
        params,
    }).catch(e => {
        const body = e.response?.data;
        const err  = body?.errors?.[0];
        const msg = err?.longMessage ?? err?.message ?? e.message ?? "";
        if (msg.toLowerCase().includes("invalid") && msg.toLowerCase().includes("sku")) {
            return { data: { offers: [], total: 0 } };
        }
        console.error("[eBay] getOffers status:", e.response?.status, "body:", JSON.stringify(body));
        throw new Error(msg);
    });
    return { offers: res.data?.offers ?? [], total: res.data?.total ?? 0 };
}

export async function deleteInventoryItemEbay(connection, sku) {
    const token = await ensureFreshToken(connection);
    await axios.delete(
        `${base(connection)}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return { ok: true, sku };
}

export async function deleteOfferEbay(connection, offerId) {
    const token = await ensureFreshToken(connection);
    await axios.delete(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return { ok: true, offerId };
}

export async function updateOfferEbay(connection, offerId, { price, quantity, listingDescription }) {
    const token = await ensureFreshToken(connection);
    const body = {};
    if (price !== undefined) body.pricingSummary = { price: { currency: "USD", value: String(price) } };
    if (quantity !== undefined) body.availableQuantity = quantity;
    if (listingDescription !== undefined) body.listingDescription = listingDescription;
    const res = await axios.put(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
}

export async function createInventoryItemEbay(connection, sku, { title, description, condition = "NEW", quantity = 9999, imageUrls = [], aspects = {} }) {
    const token = await ensureFreshToken(connection);
    const ebaySku = sanitizeEbaySku(sku);
    const body = {
        availability: { shipToLocationAvailability: { quantity } },
        condition,
        product: { title, description, aspects, imageUrls },
    };
    const res = await axios.put(
        `${base(connection)}/sell/inventory/v1/inventory_item/${encodeURIComponent(ebaySku)}`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
}

export async function createOfferEbay(connection, { sku, categoryId, listingDescription, price, fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey, publish = true }) {
    const token = await ensureFreshToken(connection);
    const ebaySku = sanitizeEbaySku(sku);
    const body = {
        sku: ebaySku,
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
        `${base(connection)}/sell/inventory/v1/offer`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    const offerId = res.data?.offerId;
    if (publish && offerId) {
        await axios.post(
            `${base(connection)}/sell/inventory/v1/offer/${offerId}/publish`,
            {},
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    }
    return { offerId, ...res.data };
}

// ─── Account Policies ─────────────────────────────────────────────────────────

export async function getAccountPoliciesEbay(connection) {
    const token = await ensureFreshToken(connection);
    const headers = { Authorization: `Bearer ${token}` };
    const b = base(connection);
    const [fulfill, payment, ret] = await Promise.all([
        axios.get(`${b}/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US`, { headers }).catch(() => ({ data: { fulfillmentPolicies: [] } })),
        axios.get(`${b}/sell/account/v1/payment_policy?marketplace_id=EBAY_US`,     { headers }).catch(() => ({ data: { paymentPolicies: [] } })),
        axios.get(`${b}/sell/account/v1/return_policy?marketplace_id=EBAY_US`,      { headers }).catch(() => ({ data: { returnPolicies: [] } })),
    ]);
    return {
        fulfillmentPolicies: fulfill.data.fulfillmentPolicies ?? [],
        paymentPolicies:     payment.data.paymentPolicies    ?? [],
        returnPolicies:      ret.data.returnPolicies          ?? [],
    };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getSellerStandardsEbay(connection) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/analytics/v1/seller_standards_profile`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(e => {
        console.error("[eBay] getSellerStandards status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: null };
    });
    return res.data;
}

export async function getTrafficReportEbay(connection, { startDate, endDate } = {}) {
    const token = await ensureFreshToken(connection);
    const end   = endDate   ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const start = startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
    const res = await axios.get(`${base(connection)}/sell/analytics/v1/traffic_report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filter: `date_range:[${start}..${end}]`, dimension: "DAY" },
    }).catch(e => {
        console.error("[eBay] getTrafficReport status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: null };
    });
    return res.data;
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export async function getTransactionsEbay(connection, { limit = 50, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/finances/v1/transaction`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, sort: "TRANSACTION_DATE_DESC" },
    }).catch(e => {
        const err = e.response?.data?.errors?.[0];
        console.error("[eBay] getTransactions status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { transactions: [], total: 0 } };
    });
    return { transactions: res.data?.transactions ?? [], total: res.data?.total ?? 0 };
}

export async function getPayoutsEbay(connection, { limit = 20 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/finances/v1/payout`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, sort: "LAST_ATTEMPTED_PAYOUT_DATE_DESC" },
    }).catch(e => {
        console.error("[eBay] getPayouts status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { payouts: [], total: 0 } };
    });
    return { payouts: res.data?.payouts ?? [], total: res.data?.total ?? 0 };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getConversationsEbay(connection, { limit = 20, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/messaging/v1/conversation`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset },
    }).catch(e => {
        console.error("[eBay] getConversations status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { conversations: [], total: 0 } };
    });
    return { conversations: res.data?.conversations ?? [], total: res.data?.total ?? 0 };
}

export async function getConversationMessagesEbay(connection, conversationId) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/messaging/v1/conversation/${encodeURIComponent(conversationId)}/message`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data?.messages ?? [];
}

export async function sendMessageEbay(connection, conversationId, text) {
    const token = await ensureFreshToken(connection);
    const res = await axios.post(
        `${base(connection)}/messaging/v1/conversation/${encodeURIComponent(conversationId)}/send_message`,
        { body: text },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function getFeedbackEbay(connection, { limit = 25, offset = 0, feedbackType = "RECEIVED_AS_SELLER" } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/reputation/v1/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, feedback_type: feedbackType },
    }).catch(e => {
        console.error("[eBay] getFeedback status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { feedbackList: [], total: 0, feedbackSummary: null } };
    });
    return { feedback: res.data?.feedbackList ?? [], total: res.data?.total ?? 0, summary: res.data?.feedbackSummary };
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export async function getDisputesEbay(connection, { limit = 25, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/payment_dispute/v1/payment_dispute_summaries`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset },
    }).catch(e => {
        console.error("[eBay] getDisputes status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { paymentDisputeSummaries: [], total: 0 } };
    });
    return { disputes: res.data?.paymentDisputeSummaries ?? [], total: res.data?.total ?? 0 };
}

export async function getDisputeEbay(connection, disputeId) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/payment_dispute/v1/payment_dispute/${encodeURIComponent(disputeId)}`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data;
}

// ─── Marketing ────────────────────────────────────────────────────────────────

export async function getCampaignsEbay(connection, { limit = 20 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/marketing/v1/ad_campaign`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit },
    }).catch(e => {
        console.error("[eBay] getCampaigns status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { campaigns: [], total: 0 } };
    });
    return { campaigns: res.data?.campaigns ?? [], total: res.data?.total ?? 0 };
}

export async function getPromotionsEbay(connection, { limit = 20, offset = 0 } = {}) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/marketing/v1/promotion`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset, marketplace_id: "EBAY_US" },
    }).catch(e => {
        console.error("[eBay] getPromotions status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: { promotions: [], total: 0 } };
    });
    return { promotions: res.data?.promotions ?? [], total: res.data?.total ?? 0 };
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export async function getStoreEbay(connection) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(`${base(connection)}/sell/stores/v1/store`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(e => {
        console.error("[eBay] getStore status:", e.response?.status, "body:", JSON.stringify(e.response?.data));
        return { data: null };
    });
    return res.data;
}
