// Hand a placed storefront order to the platform's routing engine (which selects a
// fulfillment provider and sends the order to their production system). The routing engine
// lives in the platform app, so we call it server-to-server with the shared internal secret.
import { logError } from "@pythias/backend/server";

const PLATFORM_BASE = process.env.PLATFORM_INTERNAL_BASE || "http://127.0.0.1:3010";

export async function routeOrderViaPlatform(orderId) {
    const key = process.env.PYTHIAS_INTERNAL_KEY;
    if (!key) return { ok: false, error: "PYTHIAS_INTERNAL_KEY not set" };
    try {
        const res = await fetch(`${PLATFORM_BASE}/api/internal/route-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pythias-internal-key": key },
            body: JSON.stringify({ orderId: String(orderId) }),
            signal: AbortSignal.timeout(20000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, status: res.status, error: data.error || `HTTP ${res.status}` };
        return { ok: true, ...data };
    } catch (e) {
        logError({ error: e, app: "storefront", provider: "storefront", source: "lib/routing routeOrderViaPlatform", context: { orderId: String(orderId) } });
        return { ok: false, error: e.message };
    }
}
