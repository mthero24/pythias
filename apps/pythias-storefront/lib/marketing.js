import jwt from "jsonwebtoken";
import { StorefrontMessage, StorefrontSuppression, StorefrontCustomer } from "@pythias/mongo";

const SECRET = process.env.STOREFRONT_JWT_SECRET || "dev-insecure-secret-change-me";

// ── Store URL (for links in emails) ──────────────────────────────────────────
export function storeBaseUrl(site) {
    if (site?.customDomain) return `https://${site.customDomain}`;
    const base = process.env.STOREFRONT_BASE_DOMAIN || "pythias.store";
    return `https://${site?.subdomain || "store"}.${base}`;
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
