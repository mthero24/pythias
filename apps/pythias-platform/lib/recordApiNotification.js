import { ApiNotification } from "@pythias/mongo";

// Record an operational notification for the API dashboard. Fire-and-forget —
// never throws into the calling request path.
// opts: { level?, source, event?, title, message?, detail? }
export async function recordApiNotification(orgId, opts) {
    if (!orgId || !opts?.source || !opts?.title) return;
    try {
        await ApiNotification.create({
            orgId,
            level:   opts.level ?? "error",
            source:  opts.source,
            event:   opts.event,
            title:   opts.title,
            message: opts.message,
            detail:  opts.detail,
        });
    } catch (e) {
        console.error("[recordApiNotification] failed:", e.message);
    }
}
