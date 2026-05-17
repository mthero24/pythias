import { UserActivity } from "@pythias/mongo";

/**
 * Log a user activity event. Never throws — failures are silently caught
 * so they never break the calling route.
 *
 * @param {object} opts
 * @param {string} opts.action   - e.g. "blank_create", "order_shipped", "dtf_sent"
 * @param {string} opts.entity   - e.g. "blank", "product", "design", "order", "dtf"
 * @param {string} [opts.entityId]
 * @param {string} [opts.entityName]
 * @param {string} [opts.userName]
 * @param {string} [opts.email]
 * @param {string} [opts.provider]
 * @param {number} [opts.count]
 */
export async function logActivity({
    action,
    entity,
    entityId = "",
    entityName = "",
    userName = "unknown",
    email = "",
    provider = "premierPrinting",
    count = 1,
}) {
    try {
        await UserActivity.create({
            action,
            entity,
            entityId: entityId?.toString() ?? "",
            entityName,
            userName,
            email,
            provider,
            count,
            timestamp: new Date(),
        });
    } catch (e) {
        console.error("logActivity error:", e.message);
    }
}

/**
 * Extract userName/email from a Next-Auth JWT token object.
 * Returns { userName, email } with safe fallbacks.
 */
export function userFromToken(token) {
    if (!token) return { userName: "unknown", email: "" };
    return {
        userName: token.name || token.email?.split("@")[0] || token.sub || "unknown",
        email: token.email || "",
    };
}
