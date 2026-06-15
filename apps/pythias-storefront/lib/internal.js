// Shared-secret guard for server-to-server calls from other Pythias apps (platform,
// premier-printing). The caller sends x-pythias-internal-key; we compare to PYTHIAS_INTERNAL_KEY.
// This is how the marketplace Stripe account stays in ONE app (the storefront) while the
// platform's Payouts UI drives Connect onboarding through these endpoints.
export function assertInternal(req) {
    const expected = process.env.PYTHIAS_INTERNAL_KEY;
    if (!expected) return { ok: false, status: 503, error: "Internal API not configured" };
    const got = req.headers.get("x-pythias-internal-key");
    if (!got || got !== expected) return { ok: false, status: 401, error: "Unauthorized" };
    return { ok: true };
}
