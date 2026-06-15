export const dynamic = "force-dynamic";
import { readUnsubToken, suppress } from "@/lib/marketing";

// GET /api/marketing/unsubscribe?token=... — one-click email/SMS unsubscribe (CAN-SPAM).
// The signed token carries org + channel + value, so no login is needed.
function page(message) {
    return new Response(
        `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#111">
           <h2>${message}</h2><p style="color:#64748b">You can close this window.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
    );
}

export async function GET(req) {
    const token = new URL(req.url).searchParams.get("token");
    const claims = token && readUnsubToken(token);
    if (!claims) return page("This unsubscribe link is invalid or expired.");
    await suppress(claims.orgId, claims.channel, claims.value, "unsubscribe");
    return page("You've been unsubscribed.");
}
