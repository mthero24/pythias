import { ErrorLog } from "@pythias/mongo";

/**
 * Log an application error. Never throws — safe to call anywhere without try/catch.
 *
 * @param {object} opts
 * @param {string|Error} opts.error      - Error object or message string
 * @param {string}       opts.source     - Where it happened: route path, function name, cron, etc.
 * @param {string}       [opts.provider]
 * @param {string}       [opts.userName]
 * @param {string}       [opts.email]
 * @param {object}       [opts.context]  - Extra data to help diagnose (orderId, sku, payload snippet…)
 */
export async function logError({ error, source = "", provider = "premierPrinting", userName = "", email = "", context = {} }) {
    try {
        const message = error instanceof Error ? error.message : String(error);
        const stack   = error instanceof Error ? (error.stack || "") : "";
        console.error(`[logError] ${source} — ${message}`);
        await ErrorLog.create({ provider, source, message, stack, context, userName, email });
    } catch (e) {
        console.error("[logError] failed to save error:", e.message);
    }
}
