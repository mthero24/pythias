// Posts a fulfillment status update back to the Pythias platform for a
// Commerce Cloud order, so the platform can update the seller's order and
// notify their storefront. Server-to-server, secret-authed. Fire-and-forget.
export async function postProviderStatus(payload) {
    const url    = process.env.PLATFORM_CALLBACK_URL;
    const secret = process.env.PROVIDER_INGEST_SECRET;
    if (!url || !secret) return;
    try {
        const res = await fetch(url, {
            method:  "POST",
            headers: { "Content-Type": "application/json", "x-pythias-secret": secret },
            body:    JSON.stringify(payload),
            signal:  AbortSignal.timeout(15000),
        });
        if (!res.ok) console.warn(`[notifyPlatform] ${payload.status} → ${res.status}`);
    } catch (e) {
        console.error("[notifyPlatform] failed:", e.message);
    }
}
