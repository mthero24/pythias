// Fire a storefront seller's Stripe Connect payout for a shipped order. The marketplace
// Stripe key lives only in the storefront app, so the platform asks it to settle, passing
// the (shared platform-DB) order id. Server-to-server, shared secret. Best-effort.
const STOREFRONT_BASE = process.env.STOREFRONT_INTERNAL_BASE || "http://127.0.0.1:3020";

export async function settleStorefrontPayout(orderId) {
    const key = process.env.PYTHIAS_INTERNAL_KEY;
    if (!key) return { ok: false, error: "PYTHIAS_INTERNAL_KEY not set" };
    try {
        const res = await fetch(`${STOREFRONT_BASE}/api/internal/payouts/settle`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pythias-internal-key": key },
            body: JSON.stringify({ orderId: String(orderId) }),
            signal: AbortSignal.timeout(20000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, status: res.status, error: data.error || `HTTP ${res.status}` };
        return { ok: true, ...data };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
