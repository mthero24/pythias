// Shared-secret guard for server-to-server calls from other Pythias apps (storefront).
// The caller sends x-pythias-internal-key; we compare to PYTHIAS_INTERNAL_KEY.
export function assertInternal(req) {
    const expected = process.env.PYTHIAS_INTERNAL_KEY;
    if (!expected) return { ok: false, status: 503, error: "Internal API not configured" };
    const got = req.headers.get("x-pythias-internal-key");
    if (!got || got !== expected) return { ok: false, status: 401, error: "Unauthorized" };
    return { ok: true };
}
