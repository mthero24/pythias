import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Products } from "@pythias/mongo";
import {
    generateEbayAuthUrl, exchangeCodeEbay,
    getOrdersEbay, shipOrderEbay,
    createInventoryItemEbay, createOfferEbay, getAccountPoliciesEbay,
} from "../functions/ebay.js";

// ─── Product listing ──────────────────────────────────────────────────────────

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

            if (offer?.categoryId) {
                const result = await createOfferEbay(connection, {
                    sku,
                    categoryId:         offer.categoryId,
                    listingDescription: offer.description ?? product.name ?? "",
                    price:              variant.price ?? offer.price ?? 0,
                    fulfillmentPolicyId: offer.fulfillmentPolicyId,
                    paymentPolicyId:     offer.paymentPolicyId,
                    returnPolicyId:      offer.returnPolicyId,
                    merchantLocationKey: offer.merchantLocationKey,
                    publish:             offer.publish !== false,
                });
                results.push({ sku, ...result });
            } else {
                results.push({ sku, ok: true });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error("[eBay] send product error:", e.message);
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

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function handleEbayOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    // Must NOT be .lean() — save() is called inside ensureFreshToken
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const orders = await getOrdersEbay(connection);
        return NextResponse.json({ orders, count: orders.length });
    } catch (e) {
        console.error("[eBay] orders GET error:", e.message);
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
        console.error("[eBay] orders POST error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function makeEbayOAuthRedirectGET({ redirectUri, provider, adminUrl }) {
    return async function handleEbayOAuthRedirectGET(req) {
        const { searchParams } = new URL(req.url);
        const code  = searchParams.get("code");
        const error = searchParams.get("error");

        if (error || !code) {
            console.error("[eBay] OAuth error:", error);
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
            console.error("[eBay] OAuth exchange error:", e.message);
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
