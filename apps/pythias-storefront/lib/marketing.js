import jwt from "jsonwebtoken";
import { StorefrontMessage, StorefrontSuppression, StorefrontCustomer, isNetworkSuppressed } from "@pythias/mongo";

const SECRET = process.env.STOREFRONT_JWT_SECRET || "dev-insecure-secret-change-me";

// ── Store URL (for links in emails) ──────────────────────────────────────────
export function storeBaseUrl(site) {
    // customDomain is an OBJECT { hostname, status, ... } — use .hostname (only when live), not the object.
    if (site?.customDomain?.hostname && site.customDomain.status === "active") return `https://${site.customDomain.hostname}`;
    const base = process.env.STOREFRONT_BASE_DOMAIN || "pythias.store";
    return `https://${site?.subdomain || "store"}.${base}`;
}

// ── Store logo (for email headers) ───────────────────────────────────────────
// The live logo lives in site.theme (logoUrl/logoStyle/logoHeight); the top-level
// logoUrl is legacy and usually empty. Returns an absolute URL, or "" when the
// store is name-only / has no logo (header then falls back to the brand name).
export function logoOf(site, baseUrl = "") {
    const t = site?.theme || {};
    const url = t.logoUrl || site?.logoUrl || "";
    const style = t.logoStyle || site?.logoStyle || "logo";
    if (!url || style === "name") return "";
    if (/^https?:/i.test(url)) return url;
    const b = baseUrl || storeBaseUrl(site);
    return b ? `${b}${url}` : url;
}
export function logoHeightOf(site) {
    const h = Number(site?.theme?.logoHeight || site?.logoHeight) || 40;
    return Math.min(Math.max(20, h), 64); // clamp so email headers stay sane
}

// ── Suppression (live opt-out gate) ──────────────────────────────────────────
export async function isSuppressed(orgId, channel, value) {
    if (!value) return true;
    const hit = await StorefrontSuppression.findOne({ orgId, channel, value: String(value).toLowerCase().trim() }).select("_id").lean();
    return !!hit;
}
export async function suppress(orgId, channel, value, reason = "unsubscribe") {
    if (!value) return;
    await StorefrontSuppression.updateOne(
        { orgId, channel, value: String(value).toLowerCase().trim() },
        { $set: { reason, at: new Date() } },
        { upsert: true }
    );
    // Reflect the opt-out on any matching customer/lead so the audience query excludes them too.
    const field = `marketingConsent.${channel}.optedIn`;
    if (channel === "email") await StorefrontCustomer.updateOne({ orgId, email: String(value).toLowerCase().trim() }, { $set: { [field]: false } });
    else if (channel === "sms") await StorefrontCustomer.updateOne({ orgId, phone: value }, { $set: { [field]: false } });
}

// ── Signed unsubscribe token (no DB row needed) ──────────────────────────────
export function unsubToken(orgId, channel, value) {
    return jwt.sign({ o: String(orgId), c: channel, v: String(value).toLowerCase().trim() }, SECRET, { expiresIn: "365d" });
}
export function readUnsubToken(token) {
    try { const d = jwt.verify(token, SECRET); return { orgId: d.o, channel: d.c, value: d.v }; }
    catch { return null; }
}
export function unsubscribeUrl(site, channel, value) {
    return `${storeBaseUrl(site)}/api/marketing/unsubscribe?token=${encodeURIComponent(unsubToken(site.orgId, channel, value))}`;
}

// ── Enqueue into the outbox (idempotent via dedupeKey) ───────────────────────
// Returns the created message, or null if it was a duplicate / suppressed.
export async function enqueueMessage(msg) {
    // Network-wide suppression (hard bounce/complaint on ANY store) blocks ALL categories — a dead
    // address should never be mailed again; it protects the shared sender reputation.
    if (await isNetworkSuppressed(msg.channel, msg.to)) return null;
    // Marketing messages skip enqueue entirely if already suppressed (keeps the queue clean;
    // the drain re-checks suppression at send time as the authoritative gate).
    if (msg.category === "marketing" && await isSuppressed(msg.orgId, msg.channel, msg.to)) return null;
    try {
        return await StorefrontMessage.create({ status: "queued", ...msg });
    } catch (e) {
        if (e?.code === 11000) return null;   // duplicate dedupeKey — already enqueued
        throw e;
    }
}

// ── Per-block usage (billing) ────────────────────────────────────────────────
// Charged per email block + per SMS block. Recorded on the org's UsageLedger; the monthly
// billing job turns counts into overage charges.
export async function recordBlockUsage(orgId, channel, n = 1) {
    try {
        const { UsageLedger } = await import("@pythias/mongo");
        if (!UsageLedger) return;
        const period = new Date().toISOString().slice(0, 7); // YYYY-MM
        const field = channel === "sms" ? "smsSent" : "emailsSent";
        await UsageLedger.updateOne({ orgId, period }, { $inc: { [field]: n }, $setOnInsert: { periodStart: new Date() } }, { upsert: true });
    } catch { /* usage is best-effort — never block a send */ }
}
