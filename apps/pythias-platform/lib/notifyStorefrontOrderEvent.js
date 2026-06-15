// Tell the storefront to email the buyer about an order-status change. The storefront owns
// buyer email + branding, so the platform just forwards the event (server-to-server, shared
// secret). Best-effort.
const STOREFRONT_BASE = process.env.STOREFRONT_INTERNAL_BASE || "http://127.0.0.1:3020";

export async function notifyStorefrontOrderEvent({ orderId, status, trackingUrl }) {
    const key = process.env.PYTHIAS_INTERNAL_KEY;
    if (!key) return { ok: false, error: "PYTHIAS_INTERNAL_KEY not set" };
    try {
        const res = await fetch(`${STOREFRONT_BASE}/api/internal/notify/order-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pythias-internal-key": key },
            body: JSON.stringify({ orderId: String(orderId), status, trackingUrl }),
            signal: AbortSignal.timeout(15000),
        });
        const data = await res.json().catch(() => ({}));
        return res.ok ? { ok: true, ...data } : { ok: false, status: res.status, error: data.error };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
