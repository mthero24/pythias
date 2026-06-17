import crypto from "crypto";
import { ErrorLog } from "@pythias/mongo";

// Keys whose values must never be written to the error log.
const SECRET_KEY = /(pass|password|secret|token|apikey|api_key|authorization|cookie|key|cipher|refresh|access)/i;

// Shallow-sanitize a context object: drop secret-looking keys, cap string sizes, keep it small.
function sanitize(ctx) {
    if (!ctx || typeof ctx !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(ctx)) {
        if (SECRET_KEY.test(k)) { out[k] = "[redacted]"; continue; }
        if (v == null) { out[k] = v; continue; }
        if (typeof v === "string") { out[k] = v.length > 1000 ? v.slice(0, 1000) + "…" : v; continue; }
        if (typeof v === "number" || typeof v === "boolean") { out[k] = v; continue; }
        try { const s = JSON.stringify(v); out[k] = s.length > 1000 ? s.slice(0, 1000) + "…" : JSON.parse(s); }
        catch { out[k] = String(v); }
    }
    return out;
}

// Group identical errors: provider + route/source + the first line of the message (drop volatile ids).
function fingerprintOf(provider, source, message) {
    const head = String(message || "").split("\n")[0].slice(0, 200)
        .replace(/[0-9a-f]{24}/gi, "<id>").replace(/\d+/g, "<n>"); // normalize ObjectIds + numbers
    return crypto.createHash("sha1").update(`${provider}|${source}|${head}`).digest("hex").slice(0, 16);
}

/**
 * Log an application error. Never throws — safe to call anywhere without try/catch.
 *
 * @param {object} opts
 * @param {string|Error} opts.error      - Error object or message string
 * @param {string}       [opts.source]   - Where it happened: route path, function name, cron, etc.
 * @param {string}       [opts.app]       - emitting app: "platform" | "premier" | "storefront"
 * @param {string}       [opts.route]     - request path
 * @param {string}       [opts.method]    - HTTP method
 * @param {number}       [opts.status]    - HTTP status, if known
 * @param {string}       [opts.digest]    - Next.js error digest
 * @param {string}       [opts.provider]
 * @param {string}       [opts.orgId]
 * @param {string}       [opts.userName]
 * @param {string}       [opts.email]
 * @param {object}       [opts.context]   - Extra diagnostic data (orderId, sku, payload snippet…)
 */
export async function logError({
    error, source = "", app = "", route = "", method = "", status,
    digest = "", provider = "premierPrinting", orgId = "", userName = "", email = "", context = {},
} = {}) {
    try {
        const message = (error instanceof Error ? error.message : String(error ?? "Unknown error")) || "Unknown error";
        const stack   = error instanceof Error ? (error.stack || "") : "";
        const src     = source || route || "";
        console.error(`[logError] ${app || provider} ${method} ${src} — ${message}`);
        await ErrorLog.create({
            provider, app, source: src, route, method, status,
            message: message.slice(0, 2000), stack: String(stack).slice(0, 8000), digest,
            context: sanitize(context), fingerprint: fingerprintOf(provider, src, message),
            orgId, userName, email,
        });
    } catch (e) {
        console.error("[logError] failed to save error:", e.message);
    }
}
