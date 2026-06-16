import { ApiKeyIntegrations, Products } from "@pythias/mongo";
import {
    getOrders,
    getOrdersFaire,
    getReleasedOrdersWalmart,
    getOpenReceiptsEtsy,
    getShipAdviceAcenda,
    getOrdersEbay,
    handleWalmartSendPOST,
    handleFaireSendPOST,
    handleAmazonSendPOST,
    handleShopifySendPOST,
    handleEtsyPOST,
    handleEbaySendPOST,
    handleAcendaPOST,
} from "@pythias/integrations";
import { getShippingCreds } from "@/lib/getShippingCreds";
import { diagnoseTikTok, createTikTokProduct } from "@/functions/tikTok";

// ─────────────────────────────────────────────────────────────────────────────
// Read-only integration diagnostics. Mirrors the fetch calls in pullOrders.js but
// only COUNTS what each source returns (or captures the error) — it never saves an
// order. Surfaces "why isn't this pulling/listing" without digging through logs.
//
// Used by the hidden debug hub (/admin/integrations/debug?debug=1) and the
// /api/internal/integrations/diagnose route.
// ─────────────────────────────────────────────────────────────────────────────

const ok = (v) => (typeof v === "string" ? v.trim().length > 0 : !!v);

// Attempt a live fetch for one connection and report the count or the error.
async function probeOrderConnection(conn) {
    const type = conn.type?.toLowerCase();
    const base = {
        type,
        displayName: conn.displayName || conn.shopName || conn.sellerName || null,
        id: String(conn._id),
        pullOrdersEnabled: !!conn.pullOrdersEnabled,
    };
    try {
        if (type === "faire") {
            base.hasCreds = ok(conn.apiKey);
            const { orders: raw, error, msg } = await getOrdersFaire({ apiKey: conn.apiKey, excludedStates: "SHIPPED,CANCELED", limit: 50 });
            if (error) return { ...base, error: msg || "fetch error" };
            return { ...base, fetched: (raw ?? []).length, sample: (raw ?? []).slice(0, 3).map(o => o.display_id ?? o.id) };
        }
        if (type === "walmart") {
            base.hasCreds = ok(conn.apiKey) && ok(conn.apiSecret);
            const result = await getReleasedOrdersWalmart({ clientId: conn.apiKey, clientSecret: conn.apiSecret });
            if (result.error) return { ...base, error: result.msg || "fetch error" };
            return { ...base, fetched: (result.orders ?? []).length, sample: (result.orders ?? []).slice(0, 3).map(o => o.purchaseOrderId) };
        }
        if (type === "etsy") {
            base.hasCreds = ok(conn.apiKey) || ok(conn.refreshToken);
            const liveConn = await ApiKeyIntegrations.findById(conn._id);
            const data = await getOpenReceiptsEtsy(liveConn);
            return { ...base, fetched: (data?.results ?? []).length, sample: (data?.results ?? []).slice(0, 3).map(o => o.receipt_id) };
        }
        if (type === "ebay") {
            base.hasCreds = ok(conn.refreshToken) || ok(conn.apiKey);
            const liveConn = await ApiKeyIntegrations.findById(conn._id);
            const raw = await getOrdersEbay(liveConn);
            return { ...base, fetched: (raw ?? []).length, sample: (raw ?? []).slice(0, 3).map(o => o.orderId) };
        }
        if (type === "acenda" || conn.organization) {
            base.type = base.type || "acenda";
            base.hasCreds = ok(conn.apiKey) && ok(conn.apiSecret) && ok(conn.organization);
            const { orders: raw, error, msg } = await getShipAdviceAcenda({ clientId: conn.apiKey, clientSecret: conn.apiSecret, organization: conn.organization, unacked: true });
            if (error) return { ...base, error: msg || "fetch error" };
            return { ...base, fetched: (raw ?? []).length, sample: (raw ?? []).slice(0, 3).map(o => o.order_number ?? o.id) };
        }
        return { ...base, note: "no order-pull handler for this type (listing-only or unsupported)" };
    } catch (e) {
        return { ...base, error: e.message };
    }
}

// Diagnose every order source: ApiKeyIntegrations connections (only pull-enabled by
// default), ShipStation (shared creds), and TikTok (its own API).
export async function diagnoseOrderConnections({ includeDisabled = false } = {}) {
    const filter = includeDisabled ? {} : { pullOrdersEnabled: true };
    const connections = await ApiKeyIntegrations.find(filter).lean();

    const connectionResults = [];
    for (const conn of connections) {
        connectionResults.push(await probeOrderConnection(conn));
    }

    // ShipStation (shared account from shipping/hardware settings)
    let shipstation;
    try {
        const { shipstationAuth } = await getShippingCreds();
        const hasCreds = ok(shipstationAuth) && shipstationAuth !== ":";
        if (!hasCreds) {
            shipstation = { hasCreds: false, note: "no ShipStation creds in settings/env" };
        } else {
            const raw = await getOrders({ auth: shipstationAuth });
            shipstation = { hasCreds: true, fetched: (raw ?? []).length, sample: (raw ?? []).slice(0, 3).map(o => o.orderNumber) };
        }
    } catch (e) {
        shipstation = { hasCreds: true, error: e.message };
    }

    // TikTok (dedicated API)
    let tiktok;
    try {
        tiktok = await diagnoseTikTok();
    } catch (e) {
        tiktok = { error: e.message };
    }

    return {
        surface: "orders",
        connectionCount: connectionResults.length,
        connections: connectionResults,
        shipstation,
        tiktok,
    };
}

// Listing diagnose: which marketplaces have credentials configured + whether order-pull
// is enabled. A lightweight connection check (not a full product push, which is
// per-marketplace and risky to fire blind). TikTok reuses its richer diagnose.
export async function diagnoseListingConnections() {
    const connections = await ApiKeyIntegrations.find({}).lean();
    const results = connections.map(conn => ({
        type: conn.type?.toLowerCase() || null,
        displayName: conn.displayName || conn.shopName || conn.sellerName || null,
        id: String(conn._id),
        hasApiKey: ok(conn.apiKey),
        hasApiSecret: ok(conn.apiSecret),
        hasRefreshToken: ok(conn.refreshToken),
        organization: conn.organization || null,
        sandbox: !!conn.sandbox,
        pullOrdersEnabled: !!conn.pullOrdersEnabled,
    }));

    let tiktok;
    try {
        tiktok = await diagnoseTikTok();
    } catch (e) {
        tiktok = { error: e.message };
    }

    return {
        surface: "listing",
        connectionCount: results.length,
        connections: results,
        tiktok,
    };
}

// ─── Listing test-push ────────────────────────────────────────────────────────
// Actually pushes ONE product to a marketplace and returns the marketplace's
// accept/reject + warnings. ⚠ This is a REAL push (creates/updates a listing) — it's
// the only way to surface the marketplace's true validation response. Each handler has
// a different body contract, so we normalize {marketplace, connectionId, productId} and
// build what each expects, then invoke the existing send handler and return its JSON.
const fakeReq = (body) => ({ json: async () => body });
async function invokeHandler(handler, body) {
    const res = await handler(fakeReq(body));
    let data;
    try { data = await res.json(); } catch { data = { note: "handler returned no JSON body" }; }
    return { httpStatus: res.status ?? 200, response: data };
}

export async function testPushListing({ marketplace, connectionId, productId }) {
    const mk = (marketplace || "").toLowerCase();
    if (!mk || !productId) throw new Error("marketplace and productId are required");

    // TikTok has its own product creator (not an HTTP send handler).
    if (mk === "tiktok") {
        const product = await Products.findById(productId)
            .populate("blanks").populate("variantsArray.color").populate("variantsArray.blank").populate("design")
            .lean();
        if (!product) throw new Error("Product not found");
        try {
            const result = await createTikTokProduct({ product });
            return { marketplace: mk, ok: true, response: result };
        } catch (e) {
            return { marketplace: mk, ok: false, error: e.message };
        }
    }

    if (!connectionId) throw new Error("connectionId is required");

    // Handlers that take { connectionId, productId } directly.
    const directShape = { walmart: handleWalmartSendPOST, faire: handleFaireSendPOST, amazon: handleAmazonSendPOST };
    if (directShape[mk]) {
        return { marketplace: mk, ...(await invokeHandler(directShape[mk], { connectionId, productId })) };
    }

    // Handlers that need the loaded product (and sometimes connection) objects.
    const [connection, product] = await Promise.all([
        ApiKeyIntegrations.findById(connectionId).lean(),
        Products.findById(productId).populate("blanks").populate("variantsArray.color").lean(),
    ]);
    if (!connection) throw new Error("Connection not found");
    if (!product) throw new Error("Product not found");

    if (mk === "ebay")   return { marketplace: mk, ...(await invokeHandler(handleEbaySendPOST, { connectionId, product })) };
    if (mk === "acenda") return { marketplace: mk, ...(await invokeHandler(handleAcendaPOST, { connectionId, product })) };
    if (mk === "etsy")   return { marketplace: mk, ...(await invokeHandler(handleEtsyPOST, { connection, product })) };
    if (mk === "shopify")return { marketplace: mk, ...(await invokeHandler(handleShopifySendPOST, { connection, product })) };

    throw new Error(`test-push not supported for marketplace "${mk}"`);
}
