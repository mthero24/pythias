import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ApiKeyIntegrations } from "@pythias/mongo";
import {
    generateEbayAuthUrl, exchangeCodeEbay,
    getSellerIdentityEbay,
    getOrdersEbay, shipOrderEbay,
    getInventoryItemsEbay, getOffersEbay, updateOfferEbay, deleteInventoryItemEbay, deleteOfferEbay,
    createInventoryItemEbay, createOfferEbay, getAccountPoliciesEbay,
    getSellerStandardsEbay, getTrafficReportEbay,
    getTransactionsEbay, getPayoutsEbay,
    getConversationsEbay, getConversationMessagesEbay, sendMessageEbay,
    getFeedbackEbay,
    getDisputesEbay, getDisputeEbay,
    getCampaignsEbay, getPromotionsEbay,
    getStoreEbay,
} from "../functions/ebay.js";

// ─── Identity ─────────────────────────────────────────────────────────────────

export async function handleEbayIdentityGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getSellerIdentityEbay(connection);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function handleEbayGET(req) {
    return NextResponse.json({ error: "not implemented" });
}

export async function handleEbaySendPOST(req) {
    const body = await req.json();
    const { connectionId, product, offer } = body;
    if (!connectionId || !product) {
        return NextResponse.json({ error: "connectionId and product required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const blank = product.blanks?.[0] ?? null;
        const blankOverrides = blank?.marketPlaceOverrides?.[connection.displayName]
            ?? blank?.marketPlaceOverrides?.["eBay"]
            ?? blank?.marketPlaceOverrides?.["ebay"]
            ?? {};

        const categoryId          = offer?.categoryId          ?? blankOverrides.categoryId;
        const fulfillmentPolicyId = offer?.fulfillmentPolicyId ?? blankOverrides.fulfillmentPolicyId;
        const paymentPolicyId     = offer?.paymentPolicyId     ?? blankOverrides.paymentPolicyId;
        const returnPolicyId      = offer?.returnPolicyId      ?? blankOverrides.returnPolicyId;
        const merchantLocationKey = offer?.merchantLocationKey ?? blankOverrides.merchantLocationKey;

        const variants = product.variantsArray ?? [];
        const results = [];
        for (const variant of variants) {
            const sku = variant.sku;
            if (!sku) continue;
            const imageUrls = [];
            if (product.design?.images?.front) imageUrls.push(product.design.images.front);
            if (product.design?.images?.back)  imageUrls.push(product.design.images.back);
            await createInventoryItemEbay(connection, sku, {
                title:       offer?.title ?? product.name ?? "Custom Print Item",
                description: offer?.description ?? product.description ?? "",
                condition:   "NEW",
                quantity:    variant.quantity ?? 9999,
                imageUrls,
                aspects: {
                    ...(variant.color?.name ? { Color: [variant.color.name] } : {}),
                    ...(variant._sizeName    ? { Size:  [variant._sizeName]  } : {}),
                    Brand: [product.brand ?? "Custom"],
                },
            });
            if (categoryId) {
                const result = await createOfferEbay(connection, {
                    sku,
                    categoryId,
                    listingDescription:  offer?.description ?? product.name ?? "",
                    price:               variant.price ?? offer?.price ?? 0,
                    fulfillmentPolicyId,
                    paymentPolicyId,
                    returnPolicyId,
                    merchantLocationKey,
                    publish:             offer?.publish !== false,
                });
                results.push({ sku, ...result });
            } else {
                results.push({ sku, ok: true });
            }
        }
        return NextResponse.json({ success: true, results });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayPoliciesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const policies = await getAccountPoliciesEbay(connection);
        return NextResponse.json(policies);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const orders = await getOrdersEbay(connection);
        return NextResponse.json({ orders, count: orders.length });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, trackingNumber, carrier, lineItemIds } = body;
    if (!connectionId || !orderId || !trackingNumber) {
        return NextResponse.json({ error: "connectionId, orderId, and trackingNumber required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await shipOrderEbay(connection, orderId, { trackingNumber, carrier, lineItemIds });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function handleEbayListingsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const tab    = searchParams.get("tab") ?? "items";
    const limit  = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const sku    = searchParams.get("sku") ?? undefined;
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (tab === "offers") {
            const data = await getOffersEbay(connection, { sku, limit, offset });
            return NextResponse.json(data);
        }
        const data = await getInventoryItemsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayListingsPUT(req) {
    const body = await req.json();
    const { connectionId, offerId, price, quantity, listingDescription } = body;
    if (!connectionId || !offerId) return NextResponse.json({ error: "connectionId and offerId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await updateOfferEbay(connection, offerId, { price, quantity, listingDescription });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayListingsDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const sku          = searchParams.get("sku");
    const offerId      = searchParams.get("offerId");
    if (!connectionId || (!sku && !offerId)) return NextResponse.json({ error: "connectionId and sku or offerId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = offerId
            ? await deleteOfferEbay(connection, offerId)
            : await deleteInventoryItemEbay(connection, sku);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function handleEbayAnalyticsGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type") ?? "traffic";
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "standards") {
            const data = await getSellerStandardsEbay(connection);
            return NextResponse.json(data);
        }
        const startDate = searchParams.get("startDate") ?? undefined;
        const endDate   = searchParams.get("endDate") ?? undefined;
        const data = await getTrafficReportEbay(connection, { startDate, endDate });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export async function handleEbayFinancesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type   = searchParams.get("type") ?? "transactions";
    const limit  = parseInt(searchParams.get("limit") ?? "50");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "payouts") {
            const data = await getPayoutsEbay(connection, { limit });
            return NextResponse.json(data);
        }
        const data = await getTransactionsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function handleEbayMessagesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId     = searchParams.get("connectionId");
    const conversationId   = searchParams.get("conversationId");
    const limit  = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (conversationId) {
            const messages = await getConversationMessagesEbay(connection, conversationId);
            return NextResponse.json({ messages });
        }
        const data = await getConversationsEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleEbayMessagesPOST(req) {
    const body = await req.json();
    const { connectionId, conversationId, text } = body;
    if (!connectionId || !conversationId || !text) {
        return NextResponse.json({ error: "connectionId, conversationId, and text required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const result = await sendMessageEbay(connection, conversationId, text);
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function handleEbayFeedbackGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId  = searchParams.get("connectionId");
    const feedbackType  = searchParams.get("feedbackType") ?? "RECEIVED_AS_SELLER";
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getFeedbackEbay(connection, { limit, offset, feedbackType });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export async function handleEbayDisputesGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const disputeId    = searchParams.get("disputeId");
    const limit  = parseInt(searchParams.get("limit") ?? "25");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (disputeId) {
            const data = await getDisputeEbay(connection, disputeId);
            return NextResponse.json(data);
        }
        const data = await getDisputesEbay(connection, { limit, offset });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Marketing ────────────────────────────────────────────────────────────────

export async function handleEbayMarketingGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type") ?? "campaigns";
    const limit  = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        if (type === "promotions") {
            const data = await getPromotionsEbay(connection, { limit, offset });
            return NextResponse.json(data);
        }
        const data = await getCampaignsEbay(connection, { limit });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export async function handleEbayStoreGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    try {
        const data = await getStoreEbay(connection);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── Marketplace Account Deletion Notification ───────────────────────────────
// eBay requires this endpoint to be verified before granting production keys.
// Set EBAY_VERIFICATION_TOKEN in your env to the token you enter in the eBay
// developer portal (30–80 chars, any string you choose).
// The endpoint URL you register must match exactly what eBay calls.
// eBay verifies by GET ?challenge_code=XXX → respond SHA-256(challenge+token+url)
// Production account deletion events arrive as POST — log and acknowledge them.

export async function handleEbayNotificationsGET(req) {
    const { searchParams } = new URL(req.url);
    const challengeCode = searchParams.get("challenge_code");
    const debug         = searchParams.get("debug") === "1";

    const token       = process.env.EBAY_VERIFICATION_TOKEN;
    const endpointUrl = process.env.EBAY_NOTIFICATION_ENDPOINT_URL ?? req.url.split("?")[0];

    if (debug) {
        const hash = token && challengeCode
            ? createHash("sha256").update((challengeCode ?? "TEST") + token + endpointUrl).digest("hex")
            : null;
        return NextResponse.json({
            tokenSet:    !!token,
            tokenLength: token?.length ?? 0,
            endpointUrl,
            challengeCode: challengeCode ?? "(not provided)",
            challengeResponse: hash,
        });
    }

    if (!challengeCode) return NextResponse.json({ error: "challenge_code required" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "EBAY_VERIFICATION_TOKEN not set" }, { status: 500 });

    const hash = createHash("sha256")
        .update(challengeCode + token + endpointUrl)
        .digest("hex");

    return NextResponse.json({ challengeResponse: hash });
}

export async function handleEbayNotificationsPOST(req) {
    try {
        const body = await req.json();
        console.log("[eBay] account deletion notification:", JSON.stringify(body));
    } catch {}
    return new NextResponse(null, { status: 200 });
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function makeEbayOAuthRedirectGET({ redirectUri, provider, adminUrl }) {
    return async function handleEbayOAuthRedirectGET(req) {
        const { searchParams } = new URL(req.url);
        const code  = searchParams.get("code");
        const error = searchParams.get("error");
        if (error || !code) {
            return NextResponse.redirect(`${adminUrl}?error=ebay_auth_failed`);
        }
        try {
            const tokens = await exchangeCodeEbay(code);
            const conn = new ApiKeyIntegrations({
                apiKey:       tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenType:    "bearer",
                type:         "ebay",
                provider,
                displayName:  "eBay Store",
                organization: "admin",
                pullOrdersEnabled: true,
            });
            await conn.save();
            return NextResponse.redirect(adminUrl);
        } catch (e) {
            return NextResponse.json({ error: e.toString() }, { status: 500 });
        }
    };
}

export async function handleEbayOAuthInitGET(req) {
    const { searchParams } = new URL(req.url);
    const redirectUri = searchParams.get("redirectUri") ?? "";
    const state       = searchParams.get("state") ?? Math.random().toString(36).slice(2);
    const url = generateEbayAuthUrl(redirectUri, state);
    return NextResponse.redirect(url);
}

// Routes OAuth through Pythias (central callback like TikTok).
// State encodes: "<provider>" or "<provider>:sandbox"
// Add ?debug=1 to return the auth URL as JSON instead of redirecting.
export function makeEbayOAuthInitGET({ provider }) {
    return async function(req) {
        const { searchParams } = new URL(req.url);
        const sandbox = searchParams.get("sandbox") === "1";
        const debug   = searchParams.get("debug") === "1";
        const state   = `${provider}${sandbox ? ":sandbox" : ""}`;
        const url     = generateEbayAuthUrl("", state, { sandbox });
        if (debug) return NextResponse.json({ url, sandbox, state });
        return NextResponse.redirect(url);
    };
}
