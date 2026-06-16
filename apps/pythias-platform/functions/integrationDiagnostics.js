import { ApiKeyIntegrations, PlatformProduct, TikTokAuth } from "@pythias/mongo";
import {
    getOrders,
    getOrdersFaire,
    getReleasedOrdersWalmart,
    getOpenReceiptsEtsy,
    getShipAdviceAcenda,
    getOrdersEbay,
} from "@pythias/integrations";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { diagnoseTikTok, createTikTokListing } from "@/functions/tikTok";

// ─────────────────────────────────────────────────────────────────────────────
// Read-only PER-ORG integration diagnostics (platform mirror of premier's). Mirrors
// the fetch calls in pullOrders.js but only COUNTS results (or captures the error) —
// never saves an order. Always scoped to one org's connections + SS creds + TikTok.
// ─────────────────────────────────────────────────────────────────────────────

const ok = (v) => (typeof v === "string" ? v.trim().length > 0 : !!v);

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

// Diagnose one org's order sources: its ApiKeyIntegrations connections, its own
// ShipStation creds (OrgIntegrations.shipstation), and its TikTok connection.
export async function diagnoseOrderConnections(orgId, { includeDisabled = false } = {}) {
    if (!orgId) throw new Error("orgId is required");
    const filter = includeDisabled ? { orgId } : { orgId, pullOrdersEnabled: true };
    const connections = await ApiKeyIntegrations.find(filter).lean();

    const connectionResults = [];
    for (const conn of connections) {
        connectionResults.push(await probeOrderConnection(conn));
    }

    // ShipStation from this org's shipping/hardware settings
    let shipstation;
    try {
        const orgCreds = await getOrgCreds(orgId);
        const ss = orgCreds?.shipstation;
        if (!ss?.apiKey || !ss?.apiSecret) {
            shipstation = { hasCreds: false, note: "org has not configured ShipStation in shipping settings" };
        } else {
            const raw = await getOrders({ auth: `${ss.apiKey}:${ss.apiSecret}` });
            shipstation = { hasCreds: true, fetched: (raw ?? []).length, sample: (raw ?? []).slice(0, 3).map(o => o.orderNumber) };
        }
    } catch (e) {
        shipstation = { hasCreds: true, error: e.message };
    }

    let tiktok;
    try {
        tiktok = await diagnoseTikTok(orgId);
    } catch (e) {
        tiktok = { error: e.message };
    }

    return { surface: "orders", orgId: String(orgId), connectionCount: connectionResults.length, connections: connectionResults, shipstation, tiktok };
}

// Listing diagnose for one org: which marketplaces have credentials configured.
export async function diagnoseListingConnections(orgId) {
    if (!orgId) throw new Error("orgId is required");
    const connections = await ApiKeyIntegrations.find({ orgId }).lean();
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
        tiktok = await diagnoseTikTok(orgId);
    } catch (e) {
        tiktok = { error: e.message };
    }

    return { surface: "listing", orgId: String(orgId), connectionCount: results.length, connections: results, tiktok };
}

// ─── Listing test-push (platform, per-org) ────────────────────────────────────
// TikTok is wired via the org-scoped createTikTokListing. The other marketplaces use the
// shared @pythias send handlers, which internally look up the BASE Products model (premier-
// oriented) — not PlatformProduct — so they aren't safe to fire for platform products yet.
export async function testPushListing(orgId, { marketplace, productId, connectionId }) {
    const mk = (marketplace || "").toLowerCase();
    if (!orgId) throw new Error("orgId is required");
    if (!mk || !productId) throw new Error("marketplace and productId are required");

    if (mk === "tiktok") {
        const product = await PlatformProduct.findById(productId)
            .populate("blanks").populate("variantsArray.color").populate("variantsArray.blank").populate("design")
            .lean();
        if (!product) throw new Error("Product not found for this org");
        const credentials = connectionId
            ? await TikTokAuth.findById(connectionId)
            : await TikTokAuth.findOne({ orgId });
        if (!credentials) throw new Error("No TikTok connection for this org");
        if (String(credentials.orgId) !== String(orgId)) throw new Error("Connection does not belong to this org");
        try {
            const result = await createTikTokListing({ product, credentials });
            return { marketplace: mk, ok: true, response: result };
        } catch (e) {
            return { marketplace: mk, ok: false, error: e.message };
        }
    }

    return {
        marketplace: mk,
        ok: false,
        note: "Test-push on the platform is currently wired for TikTok only. Other marketplaces use shared send handlers that read the base Products model (premier), not PlatformProduct — needs a platform-native listing path first.",
    };
}
