// Server-side GA4 Measurement Protocol. Sends events straight to Google from our server — bypassing
// the gtag.js loader (which 404s for some measurement IDs) AND client-side ad blockers / Brave / Pi-hole.
// Per-store creds live on site.analytics: ga4Id (G-XXXX) + ga4ApiSecret (created in GA Admin → Data
// streams → Measurement Protocol API secrets). Fire-and-forget; never throws into the request path.
// GA4 needs session_id + engagement_time_msec on each event or they won't register as sessions in
// reports — injected here so callers only pass the meaningful params.
export async function sendGa4(site, clientId, events) {
    const measurementId = site?.analytics?.ga4Id;
    const apiSecret = site?.analytics?.ga4ApiSecret;
    if (!measurementId || !apiSecret || !clientId || !Array.isArray(events) || !events.length) return;
    const cid = String(clientId);
    const body = {
        client_id: cid,
        events: events.map((e) => ({ name: e.name, params: { session_id: cid, engagement_time_msec: 1, ...(e.params || {}) } })),
    };
    try {
        await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(3000),
        });
    } catch { /* analytics must never break the request */ }
}
