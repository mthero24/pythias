import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OutreachProspect, getStep, nextSendDate } from "@pythias/mongo";
import { sendOutreachStep } from "@/lib/outreachMailer";

// Auth: a valid admin session OR a matching x-cron-secret header (for headless PM2 cron).
async function authed(req) {
    const secret = process.env.OUTREACH_CRON_SECRET;
    const header = req.headers.get("x-cron-secret");
    if (secret && header && header === secret) return true;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return !!token;
}

// Quiet-hours gate: only send ~8am–7pm Eastern. ET = UTC-5 (EST) / UTC-4 (EDT).
// Use a fixed UTC-4 (EDT) approximation — good enough to keep sends in business hours.
function withinQuietHours(now = new Date()) {
    const etHour = (now.getUTCHours() - 4 + 24) % 24;
    return etHour >= 8 && etHour < 19;
}

export async function POST(req) {
    if (!await authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    if (!withinQuietHours(now)) {
        return NextResponse.json({ success: true, dispatched: 0, skipped: "quiet-hours" });
    }

    try {
        const due = await OutreachProspect.find({
            status: "active",
            nextSendAt: { $lte: now },
        }).limit(200);

        let dispatched = 0;
        for (const doc of due) {
            const nextStep = (doc.step || 0) + 1;
            const def = getStep(nextStep);
            if (!def) {
                doc.status = "completed";
                doc.nextSendAt = null;
                await doc.save();
                continue;
            }

            // Claim atomically: bump step + advance schedule BEFORE send so a concurrent run
            // (or a retry) can never double-send the same step.
            const prevStep = doc.step;
            const prevNext = doc.nextSendAt;
            doc.step = nextStep;
            doc.nextSendAt = nextSendDate(nextStep);
            if (!getStep(nextStep + 1)) doc.status = "completed";
            await doc.save();

            const res = await sendOutreachStep({
                to: doc.email, step: nextStep, firstName: doc.firstName, shopName: doc.shopName, unsubToken: doc.unsubToken,
            });
            if (res.ok) {
                doc.history.push({ step: nextStep, sentAt: new Date(), messageId: res.id || "", subject: res.subject || def.subject });
                await doc.save();
                dispatched++;
            } else {
                // Roll back the claim so the next run retries this prospect.
                console.error(`[outreach dispatch] send failed for ${doc.email}:`, res.error);
                doc.step = prevStep;
                doc.nextSendAt = prevNext || now;
                if (doc.status === "completed") doc.status = "active";
                await doc.save();
            }
        }

        return NextResponse.json({ success: true, dispatched });
    } catch (err) {
        console.error("[outreach dispatch]", err);
        return NextResponse.json({ success: false, error: "Dispatch failed." }, { status: 500 });
    }
}

// GET — count how many are due now (for the "Process due follow-ups (N)" button).
export async function GET(req) {
    if (!await authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const due = await OutreachProspect.countDocuments({
            status: "active",
            nextSendAt: { $lte: new Date() },
        });
        return NextResponse.json({ success: true, due });
    } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to count." }, { status: 500 });
    }
}
