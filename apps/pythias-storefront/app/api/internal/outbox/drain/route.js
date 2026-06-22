export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontMessage, StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { sendEmail, brandedFrom } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { isNetworkSuppressed } from "@pythias/mongo";
import { isSuppressed, recordBlockUsage } from "@/lib/marketing";

// POST /api/internal/outbox/drain  (run on a short interval by PM2)
// Sends up to OUTBOX_BATCH due messages. The batch size × cron interval IS the send rate —
// keep it low to warm up sender reputation. Marketing messages re-check suppression here
// (authoritative). Failures back off and retry up to 5 times.
const BATCH = Math.max(1, Number(process.env.OUTBOX_BATCH) || 30);
const MAX_ATTEMPTS = 5;

export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const now = new Date();
    let sent = 0, skipped = 0, failed = 0, processed = 0;

    // Per-store sender name: emails go out as the store's own brand (on the verified domain),
    // resolved from the org's storefront name and cached for this drain pass.
    const fromCache = new Map();
    const fromForOrg = async (orgId) => {
        const k = String(orgId);
        if (fromCache.has(k)) return fromCache.get(k);
        let from;
        try {
            const site = (await StorefrontSite.findOne({ orgId, plan: { $ne: "none" } }).select("name").lean())
                || (await StorefrontSite.findOne({ orgId }).select("name").lean());
            from = brandedFrom(site?.name);
        } catch { from = undefined; }
        fromCache.set(k, from);
        return from;
    };

    for (let i = 0; i < BATCH; i++) {
        // Atomically claim the next due message so concurrent drains never double-send.
        const msg = await StorefrontMessage.findOneAndUpdate(
            { status: "queued", scheduledAt: { $lte: now } },
            { $set: { status: "sending" }, $inc: { attempts: 1 } },
            { sort: { scheduledAt: 1 }, new: true }
        );
        if (!msg) break;
        processed++;

        // Network-wide suppression (hard bounce/complaint anywhere) — skip ALL categories.
        if (await isNetworkSuppressed(msg.channel, msg.to)) {
            msg.status = "skipped"; msg.error = "network-suppressed"; await msg.save(); skipped++; continue;
        }
        // Marketing: honor opt-outs at send time.
        if (msg.category === "marketing" && await isSuppressed(msg.orgId, msg.channel, msg.to)) {
            msg.status = "skipped"; msg.error = "suppressed"; await msg.save(); skipped++; continue;
        }

        const res = msg.channel === "sms"
            ? await sendSMS({ to: msg.to, body: msg.body })
            : await sendEmail({ to: msg.to, subject: msg.subject, html: msg.html, from: await fromForOrg(msg.orgId) });

        if (res.ok) {
            msg.status = "sent"; msg.sentAt = new Date(); msg.providerId = res.id || null; msg.error = undefined;
            await msg.save();
            await recordBlockUsage(msg.orgId, msg.channel, 1);   // per-block billing
            sent++;
        } else if (msg.attempts >= MAX_ATTEMPTS) {
            msg.status = "failed"; msg.error = res.error; await msg.save(); failed++;
        } else {
            // Back off: re-queue a few minutes out.
            msg.status = "queued"; msg.error = res.error; msg.scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
            await msg.save();
        }
    }

    return NextResponse.json({ processed, sent, skipped, failed });
}
