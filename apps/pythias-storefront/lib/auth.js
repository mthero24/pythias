import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Token-based buyer auth — works for the web storefront AND the white-label mobile apps
// (apps store the token; cookies aren't enough cross-platform). Token is scoped to one
// customer of one org.
const SECRET = process.env.STOREFRONT_JWT_SECRET || "dev-insecure-secret-change-me";
const TTL = "30d";

export async function hashPassword(pw) {
    return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw, hash) {
    if (!hash) return false;
    return bcrypt.compare(pw, hash);
}

export function signToken({ customerId, orgId }) {
    return jwt.sign({ sub: String(customerId), org: String(orgId) }, SECRET, { expiresIn: TTL });
}

export function verifyToken(token) {
    try { return jwt.verify(token, SECRET); } catch { return null; }
}

// Pull the bearer token from an incoming request.
export function bearer(req) {
    const h = req.headers.get("authorization") || "";
    return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// Best-effort client IP for consent proof.
export function clientIp(req) {
    const xff = req.headers.get("x-forwarded-for");
    return (xff ? xff.split(",")[0] : req.headers.get("x-real-ip") || "").trim() || null;
}

// Safe customer projection for API responses (never leak the hash).
export function publicCustomer(c) {
    return {
        id: String(c._id), email: c.email, name: c.name ?? null, phone: c.phone ?? null,
        rewardsBalance: c.rewardsBalance ?? 0,
        marketingConsent: {
            email: !!c.marketingConsent?.email?.optedIn,
            sms: !!c.marketingConsent?.sms?.optedIn,
            push: !!c.marketingConsent?.push?.optedIn,
        },
    };
}
