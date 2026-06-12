import { Organization } from "@pythias/mongo";
import { dispatchWebhook } from "@/lib/webhookDispatcher";

// Notify a partner's storefront that something changed on our side.
// Fire-and-forget: looks up the org's webhook config and dispatches if active.
// dispatchWebhook itself filters by the org's subscribed `events` list.
//
// Events: order.received, order.updated, order.shipped, order.delivered,
//         order.cancelled, product.updated, design.updated
export async function notifyPartner(orgId, event, data) {
    if (!orgId) return;
    try {
        const org = await Organization.findById(orgId).select("partnerWebhook").lean();
        if (!org?.partnerWebhook?.active || !org.partnerWebhook.url) return;
        await dispatchWebhook(org, event, data);
    } catch (e) {
        console.error(`[notifyPartner] ${event} for org ${orgId} failed:`, e.message);
    }
}
