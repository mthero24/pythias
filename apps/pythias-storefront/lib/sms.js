// Lazy Twilio SMS. Dynamically imported so a missing package/credentials degrades gracefully
// (returns { ok:false }) instead of breaking the build or the outbox drain.
let _client = null;
async function client() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;            // AC… (always required)
    const apiKeySid = process.env.TWILIO_API_KEY_SID;             // SK… + secret — preferred (revocable, scoped)
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const authToken = process.env.TWILIO_AUTH_TOKEN;              // fallback: the account Auth Token
    if (!accountSid) return null;
    if (_client) return _client;
    try {
        const twilio = (await import("twilio")).default;
        if (apiKeySid && apiKeySecret) _client = twilio(apiKeySid, apiKeySecret, { accountSid });
        else if (authToken) _client = twilio(accountSid, authToken);
        else return null;
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
