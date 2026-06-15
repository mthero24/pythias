// Lazy Twilio SMS. Dynamically imported so a missing package/credentials degrades gracefully
// (returns { ok:false }) instead of breaking the build or the outbox drain.
let _client = null;
async function client() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    if (_client) return _client;
    try {
        const twilio = (await import("twilio")).default;
        _client = twilio(sid, token);
        return _client;
    } catch {
        return null;   // package not installed
    }
}

const FROM = process.env.TWILIO_FROM_NUMBER;            // E.164, e.g. +13135551234
const MESSAGING_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;  // preferred if set

// Send one SMS. Returns { ok, id } or { ok:false, error }.
export async function sendSMS({ to, body }) {
    const c = await client();
    if (!c) return { ok: false, error: "Twilio not configured" };
    if (!FROM && !MESSAGING_SID) return { ok: false, error: "No TWILIO_FROM_NUMBER / messaging service" };
    try {
        const msg = await c.messages.create({
            to, body,
            ...(MESSAGING_SID ? { messagingServiceSid: MESSAGING_SID } : { from: FROM }),
        });
        return { ok: true, id: msg.sid };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
