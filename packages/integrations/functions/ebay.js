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
    "https://api.ebay.com/oauth/api_scope/sell.account",
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
    // eBay requires sku when listing offers — without it the endpoint returns nothing
    // If no sku provided, pivot to inventory items and enrich each with its offers
    if (!sku) {
        const items = await getInventoryItemsEbay(connection, { limit, offset });
        const offers = [];
        for (const item of items.items ?? []) {
            try {
                const o = await getOffersEbay(connection, { sku: item.sku, limit: 25, offset: 0 });
                offers.push(...(o.offers ?? []));
            } catch { /* skip items with no offers */ }
        }
        return { offers, total: offers.length };
    }
    const params = { sku: sanitizeEbaySku(sku), limit, offset };
    const res = await axios.get(`${base(connection)}/sell/inventory/v1/offer`, {
        headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en-US" },
        params,
    }).catch(e => {
        const body = e.response?.data;
        const err  = body?.errors?.[0];
        const msg = err?.longMessage ?? err?.message ?? e.message ?? "";
        const safeErrorIds = new Set([25004, 25713]);
        if (safeErrorIds.has(err?.errorId) || e.response?.status === 404 || msg.toLowerCase().includes("no offers")) {
            return { data: { offers: [], total: 0 } };
        }
        console.error("[eBay] getOffers status:", e.response?.status, "body:", JSON.stringify(body));
        throw new Error(msg);
    });
    console.log("[eBay] getOffers sku:", sku, "total:", res.data?.total, "count:", res.data?.offers?.length);
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
    // GET current offer so we can do a full-body PUT (eBay PUT replaces entire offer)
    const current = await axios.get(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(() => null);
    const body = { ...(current?.data ?? {}) };
    // strip read-only fields eBay rejects on PUT
    delete body.offerId;
    delete body.status;
    delete body.listing;
    // ensure merchantLocationKey is present — eBay needs it to derive Item.Country on publish
    if (!body.merchantLocationKey) {
        body.merchantLocationKey = await resolveLocationKey(connection, token, null);
    }
    if (price !== undefined)              body.pricingSummary    = { price: { currency: "USD", value: parseFloat(price).toFixed(2) } };
    if (quantity !== undefined)           body.availableQuantity = quantity;
    if (listingDescription !== undefined) body.listingDescription = listingDescription;
    const res = await axios.put(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
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
    console.log("[eBay] createInventoryItem sku:", ebaySku, "body:", JSON.stringify(body));
    const res = await axios.put(
        `${base(connection)}/sell/inventory/v1/inventory_item/${encodeURIComponent(ebaySku)}`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        console.error("[eBay] createInventoryItem error:", JSON.stringify(e.response?.data));
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return res.data ?? { ok: true };
}

async function resolveLocationKey(connection, token, providedKey) {
    if (providedKey) return providedKey;
    const b = base(connection);
    const h = { Authorization: `Bearer ${token}` };
    const list = await axios.get(`${b}/sell/inventory/v1/location`, { headers: h })
        .catch(() => ({ data: { locations: [] } }));
    const existing = list.data?.locations?.[0];
    if (existing) return existing.merchantLocationKey;
    // key must be alphanumeric + dash only (no underscores) per eBay spec
    const defaultKey = "default-us-warehouse";
    let addr = {};
    try { addr = JSON.parse(process.env.businessAddress ?? "{}"); } catch {}
    await axios.post(
        `${b}/sell/inventory/v1/location/${defaultKey}`,
        {
            location: {
                address: {
                    addressLine1:    addr.addressLine1 ?? "2901 14th N",
                    city:            addr.city         ?? "Ammon",
                    stateOrProvince: addr.state        ?? "ID",
                    postalCode:      addr.postalCode   ?? "83401",
                    country:         addr.country      ?? "US",
                },
            },
            locationTypes: ["WAREHOUSE"],
            name: addr.name ?? "Default US Location",
            merchantLocationStatus: "ENABLED",
        },
        { headers: { ...h, "Content-Type": "application/json" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        // 25002 = location key already exists — that's fine, just use it
        if (errs.some(err => err.errorId === 25002)) return;
        console.error("[eBay] create location error:", JSON.stringify(e.response?.data ?? e.message));
        throw new Error(errs[0]?.message ?? "Failed to create merchant location");
    });
    return defaultKey;
}

export async function createInventoryItemGroupEbay(connection, groupKey, { title, description, aspects = {}, imageUrls = [], variantSKUs = [], variesBy = {} }) {
    const token = await ensureFreshToken(connection);
    const body = {
        title,
        description,
        aspects,
        ...(imageUrls?.length ? { imageUrls } : {}),
        variantSKUs: variantSKUs.map(s => sanitizeEbaySku(s)),
        ...(variesBy?.specifications?.length ? { variesBy } : {}),
    };
    console.log("[eBay] createInventoryItemGroup body:", JSON.stringify(body));
    await axios.put(
        `${base(connection)}/sell/inventory/v1/inventory_item_group/${encodeURIComponent(groupKey)}`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        console.error("[eBay] createGroup error:", JSON.stringify(e.response?.data));
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return { ok: true, groupKey };
}

export async function createOfferEbay(connection, { sku, inventoryItemGroupKey, categoryId, listingDescription, price, quantity, fulfillmentPolicyId, paymentPolicyId, returnPolicyId, merchantLocationKey, publish = true }) {
    const token = await ensureFreshToken(connection);
    const locationKey = await resolveLocationKey(connection, token, merchantLocationKey);
    const policies = {};
    if (fulfillmentPolicyId) policies.fulfillmentPolicyId = fulfillmentPolicyId;
    if (paymentPolicyId)     policies.paymentPolicyId     = paymentPolicyId;
    if (returnPolicyId)      policies.returnPolicyId      = returnPolicyId;
    const cleanCategoryId = categoryId != null ? String(categoryId) : "";
    if (!cleanCategoryId || cleanCategoryId === "undefined" || cleanCategoryId === "null") {
        throw new Error("A valid eBay category ID is required. Check the blank's marketplace overrides or enter a category when creating the offer.");
    }
    const body = {
        ...(inventoryItemGroupKey ? { inventoryItemGroupKey } : { sku: sanitizeEbaySku(sku) }),
        marketplaceId:      "EBAY_US",
        format:             "FIXED_PRICE",
        categoryId:         cleanCategoryId,
        listingDescription,
        ...(Object.keys(policies).length ? { listingPolicies: policies } : {}),
        merchantLocationKey: locationKey,
        pricingSummary:     { price: { currency: "USD", value: parseFloat(price).toFixed(2) } },
        ...(!inventoryItemGroupKey ? { availableQuantity: quantity != null ? Math.max(1, parseInt(quantity)) : 1 } : {}),
    };
    console.log("[eBay] createOffer body:", JSON.stringify(body));
    let offerId;
    let offerData = {};
    try {
        const res = await axios.post(
            `${base(connection)}/sell/inventory/v1/offer`,
            body,
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
        );
        offerId  = res.data?.offerId;
        offerData = res.data ?? {};
    } catch (e) {
        const errs = e.response?.data?.errors ?? [];
        const existing = errs.find(err => err.errorId === 25002);
        if (existing) {
            offerId = existing.parameters?.find(p => p.name === "offerId")?.value;
            console.log("[eBay] offer already exists, reusing offerId:", offerId);
            // update the existing offer with the current body (policies may have changed)
            if (offerId) {
                await axios.put(
                    `${base(connection)}/sell/inventory/v1/offer/${offerId}`,
                    body,
                    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
                ).catch(e3 => console.warn("[eBay] offer update warning:", JSON.stringify(e3.response?.data)));
            }
        } else {
            console.error("[eBay] createOffer error:", JSON.stringify(e.response?.data));
            throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
        }
    }
    let listingId;
    if (publish && offerId) {
        const pubRes = await axios.post(
            `${base(connection)}/sell/inventory/v1/offer/${offerId}/publish`,
            {},
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        ).catch(e => {
            const errs = e.response?.data?.errors ?? [];
            console.error("[eBay] publishOffer error:", JSON.stringify(e.response?.data));
            throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
        });
        listingId = pubRes.data?.listingId;
        console.log("[eBay] published offer", offerId, "→ listingId:", listingId);
    }
    return { offerId, listingId, ...offerData };
}

export async function getOfferEbay(connection, offerId) {
    const token = await ensureFreshToken(connection);
    const res = await axios.get(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data;
}

export async function publishOfferEbay(connection, offerId) {
    const token = await ensureFreshToken(connection);
    const current = await axios.get(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(() => null);

    if (current?.data) {
        const offerData = current.data;
        const storedCategoryId = String(offerData.categoryId ?? "");
        const badCategory = !storedCategoryId || storedCategoryId === "undefined" || storedCategoryId === "null";

        if (badCategory) {
            throw new Error(
                "This offer is missing a valid eBay category ID. " +
                "Delete the offer, then re-list from the inventory items tab and enter a valid eBay category."
            );
        }

        const needsLocation = !offerData.merchantLocationKey;
        const needsPolicies = !offerData.listingPolicies?.fulfillmentPolicyId;

        if (needsLocation || needsPolicies) {
            const body = { ...offerData };
            delete body.offerId; delete body.status; delete body.listing;

            if (needsLocation) {
                body.merchantLocationKey = await resolveLocationKey(connection, token, null);
            }
            if (needsPolicies) {
                try {
                    const acct = await getAccountPoliciesEbay(connection);
                    body.listingPolicies = {
                        fulfillmentPolicyId: acct.fulfillmentPolicies?.[0]?.fulfillmentPolicyId,
                        paymentPolicyId:     acct.paymentPolicies?.[0]?.paymentPolicyId,
                        returnPolicyId:      acct.returnPolicies?.[0]?.returnPolicyId,
                    };
                } catch { /* proceed — eBay may still publish without explicit policies */ }
            }

            await axios.put(
                `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`,
                body,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Language": "en-US" } }
            ).catch(e => console.warn("[eBay] publishOfferEbay pre-publish patch warning:", JSON.stringify(e.response?.data)));
        }
    }

    const res = await axios.post(
        `${base(connection)}/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        // eBay's Inventory/Offer API requires business policies (shipping/payment/return) on every
        // published fixed-price offer. If the seller account has none — or isn't opted into Business
        // Policies — publish fails with a cryptic "add a valid shipping service option" message
        // (errorId 25007) or "not eligible for Business Policy" (20403). Surface a clear, actionable one.
        const policyIssue = errs.some(x =>
            [25007, 25709, 25710, 25711, 20403].includes(x.errorId) ||
            /business polic|fulfillment polic|payment polic|return polic|shipping service/i.test(x.longMessage ?? x.message ?? "")
        );
        if (policyIssue) {
            throw new Error(
                "eBay can't publish this listing because your account has no shipping, payment, or return " +
                "business policies to attach. In eBay → Seller Hub → Account → Business Policies, create a " +
                "Shipping policy (with at least one shipping service), a Payment policy, and a Return policy, " +
                "then click Publish again."
            );
        }
        throw new Error(errs[0]?.longMessage ?? errs[0]?.message ?? e.message);
    });
    return { ok: true, listingId: res.data?.listingId };
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export async function getItemAspectsEbay(connection, categoryId) {
    const token = await ensureFreshToken(connection);
    // EBAY_US category tree ID is always "0"
    const treeId = "0";
    const b = connection?.sandbox ? API_BASE_SANDBOX : API_BASE;
    const res = await axios.get(
        `${b}/commerce/taxonomy/v1/category_tree/${treeId}/get_item_aspects_for_category?category_id=${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    const aspects = res.data?.aspects ?? [];
    return aspects.map(a => ({
        name:     a.localizedAspectName,
        required: a.aspectConstraint?.aspectRequired === true,
        mode:     a.aspectConstraint?.aspectMode,
        values:   (a.aspectValues ?? []).map(v => v.localizedValue),
    }));
}

export async function getCategorySuggestionsEbay(connection, query) {
    const token = await ensureFreshToken(connection);
    const b = connection?.sandbox ? API_BASE_SANDBOX : API_BASE;
    const res = await axios.get(
        `${b}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions`,
        { headers: { Authorization: `Bearer ${token}` }, params: { q: query } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data?.categorySuggestions ?? [];
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

export async function createFulfillmentPolicyEbay(connection, { name, handlingTimeDays = 3, shippingCarrier = "USPS", shippingService = "USPSPriority", shippingCost = "4.99", additionalCost = "2.00", freeShipping = false }) {
    const token = await ensureFreshToken(connection);
    const serviceEntry = {
        sortOrderId: 1,
        shippingCarrierCode: shippingCarrier,
        shippingServiceCode: shippingService,
        buyerResponsibleForShipping: false,
        ...(freeShipping
            ? { freeShipping: true, shippingCost: { currency: "USD", value: "0.00" } }
            : {
                shippingCost:           { currency: "USD", value: parseFloat(shippingCost).toFixed(2) },
                additionalShippingCost: { currency: "USD", value: parseFloat(additionalCost).toFixed(2) },
              }
        ),
    };
    const body = {
        name,
        marketplaceId: "EBAY_US",
        categoryTypes: [{ name: "ALL_EXCLUDING_MOTORS_VEHICLES" }],
        handlingTime: { value: parseInt(handlingTimeDays), unit: "DAY" },
        shippingOptions: [{
            optionType: "DOMESTIC",
            costType: "FLAT_RATE",
            shippingServices: [serviceEntry],
        }],
    };
    console.log("[eBay] createFulfillmentPolicy body:", JSON.stringify(body));
    const res = await axios.post(
        `${base(connection)}/sell/account/v1/fulfillment_policy`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        console.error("[eBay] createFulfillmentPolicy error:", JSON.stringify(e.response?.data));
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return res.data;
}

export async function deleteFulfillmentPolicyEbay(connection, policyId) {
    const token = await ensureFreshToken(connection);
    await axios.delete(
        `${base(connection)}/sell/account/v1/fulfillment_policy/${encodeURIComponent(policyId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return { ok: true };
}

export async function createPaymentPolicyEbay(connection, { name, immediatePay = true }) {
    const token = await ensureFreshToken(connection);
    const body = {
        name,
        marketplaceId: "EBAY_US",
        categoryTypes: [{ name: "ALL_EXCLUDING_MOTORS_VEHICLES" }],
        immediatePay,
    };
    const res = await axios.post(
        `${base(connection)}/sell/account/v1/payment_policy`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        console.error("[eBay] createPaymentPolicy error:", JSON.stringify(e.response?.data));
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return res.data;
}

export async function createReturnPolicyEbay(connection, { name, returnsAccepted = true, returnDays = 30, payer = "BUYER", refundMethod = "MONEY_BACK" }) {
    const token = await ensureFreshToken(connection);
    const body = {
        name,
        marketplaceId: "EBAY_US",
        categoryTypes: [{ name: "ALL_EXCLUDING_MOTORS_VEHICLES" }],
        returnsAccepted,
        ...(returnsAccepted ? {
            returnPeriod:            { value: parseInt(returnDays), unit: "DAY" },
            returnShippingCostPayer: payer,
            refundMethod,
        } : {}),
    };
    const res = await axios.post(
        `${base(connection)}/sell/account/v1/return_policy`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => {
        const errs = e.response?.data?.errors ?? [];
        console.error("[eBay] createReturnPolicy error:", JSON.stringify(e.response?.data));
        throw new Error(errs.map(err => err.longMessage ?? err.message).join("; ") || e.message);
    });
    return res.data;
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

export async function createCampaignEbay(connection, { name, bidPercentage = "5.0", startDate, endDate }) {
    const token = await ensureFreshToken(connection);
    const body = {
        campaignName: name,
        campaignType: "COST_PER_SALE",
        marketplaceId: "EBAY_US",
        fundingStrategy: { bidPercentage: String(bidPercentage), fundingModel: "COST_PER_SALE" },
        startDate,
        ...(endDate ? { endDate } : {}),
    };
    const res = await axios.post(
        `${base(connection)}/sell/marketing/v1/ad_campaign`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
}

export async function createPromotionEbay(connection, { name, percentageOff, startDate, endDate }) {
    const token = await ensureFreshToken(connection);
    const body = {
        name,
        marketplaceId: "EBAY_US",
        promotionType: "MARKDOWN_SALE",
        startDate,
        ...(endDate ? { endDate } : {}),
        percentageOff: String(percentageOff),
    };
    const res = await axios.post(
        `${base(connection)}/sell/marketing/v1/item_price_markdown`,
        body,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    ).catch(e => { throw new Error(e.response?.data?.errors?.[0]?.message ?? e.message); });
    return res.data ?? { ok: true };
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
