import { createHmac } from "crypto";
import { recordApiNotification } from "@/lib/recordApiNotification";

// Fires a signed webhook to a partner's registered URL.
// event: "order.received" | "order.updated" | "order.shipped" | "order.delivered"
//      | "order.cancelled" | "product.updated" | "design.updated"
// payload: the data object to send
export async function dispatchWebhook(org, event, payload) {
    const webhook = org.partnerWebhook;
    if (!webhook?.active || !webhook?.url) return;
    if (webhook.events?.length && !webhook.events.includes(event)) return;

    const body      = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() });
    const signature = webhook.secret
        ? createHmac("sha256", webhook.secret).update(body).digest("hex")
        : null;

    const headers = {
        "Content-Type": "application/json",
        "X-Pythias-Event": event,
        "X-Pythias-Delivery": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...(signature ? { "X-Pythias-Signature": `sha256=${signature}` } : {}),
    };

    try {
        const res = await fetch(webhook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
        if (!res.ok) {
            console.warn(`[webhook] ${event} → ${webhook.url} responded ${res.status}`);
            recordApiNotification(org._id, {
                level: "warning", source: "webhook", event,
                title: `Webhook ${event} delivery failed (HTTP ${res.status})`,
                message: `Your endpoint at ${webhook.url} responded with ${res.status}. Pythias expects a 2xx response within 10 seconds.`,
                detail: { url: webhook.url, statusCode: res.status, event },
            });
        }
    } catch (e) {
        console.error(`[webhook] ${event} → ${webhook.url} failed:`, e.message);
        recordApiNotification(org._id, {
            level: "error", source: "webhook", event,
            title: `Webhook ${event} could not be delivered`,
            message: `Request to ${webhook.url} failed: ${e.message}`,
            detail: { url: webhook.url, event, error: e.message },
        });
    }
}
