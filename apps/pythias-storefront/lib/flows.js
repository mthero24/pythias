import { StorefrontFlow, StorefrontSegment, StorefrontCustomer } from "@pythias/mongo";
import { enqueueMessage } from "@/lib/marketing";
import { baseTemplate } from "@/lib/email";
import { buildSegmentFilter } from "@/lib/segments";

// Enroll a customer into all active flows for a trigger: enqueue each step into the outbox at a
// cumulative delay. Idempotent per (flow, customer, token, step) via dedupeKey, so re-triggering
// the same enrollment never double-sends. `token` makes recurring triggers (any_purchase) unique.
export async function enrollFlows({ orgId, site, customer, trigger, token = "x" }) {
    if (!customer?._id) return 0;
    const flows = await StorefrontFlow.find({ orgId, trigger, active: true }).lean();
    if (!flows.length) return 0;

    const brand = site?.businessInfo?.legalName || site?.name || "Our Store";
    let enrolled = 0;

    for (const flow of flows) {
        // Optional segment gate — confirm this customer still matches.
        if (flow.segmentId) {
            const seg = await StorefrontSegment.findOne({ _id: flow.segmentId, orgId }).lean();
            if (seg) {
                const match = await StorefrontCustomer.exists({ _id: customer._id, ...buildSegmentFilter(seg) });
                if (!match) continue;
            }
        }

        let cumulativeMs = 0;
        let any = false;
        for (let i = 0; i < (flow.steps || []).length; i++) {
            const step = flow.steps[i];
            cumulativeMs += Math.max(0, (step.delayHours || 0) * 3600 * 1000);
            const scheduledAt = new Date(Date.now() + cumulativeMs);
            const to = step.channel === "sms" ? customer.phone : customer.email;
            if (!to) continue;

            const common = {
                orgId, channel: step.channel || "email", to, customerId: customer._id,
                type: "campaign", category: "marketing", scheduledAt,
                dedupeKey: `flow:${flow._id}:${customer._id}:${token}:${i}`,
            };
            const msg = step.channel === "sms"
                ? await enqueueMessage({ ...common, body: `${step.body}\nReply STOP to opt out.` }).catch(() => null)
                : await enqueueMessage({ ...common, subject: step.subject, html: baseTemplate({ brand, contentHtml: step.html || "" }) }).catch(() => null);
            if (msg) any = true;
        }
        if (any) { enrolled++; await StorefrontFlow.updateOne({ _id: flow._id }, { $inc: { "stats.enrolled": 1 } }).catch(() => {}); }
    }
    return enrolled;
}
