import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { OutreachProspect, getStep, nextSendDate } from "@pythias/mongo";
import { sendOutreachStep } from "@/lib/outreachMailer";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return token || null;
}

function parseEmails(raw) {
    if (Array.isArray(raw)) raw = raw.join("\n");
    return [...new Set(
        String(raw || "")
            .split(/[\n,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )];
}

// GET — list prospects, newest first.
export async function GET(req) {
    const token = await auth(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const prospects = await OutreachProspect.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, prospects: JSON.parse(JSON.stringify(prospects)) });
    } catch (err) {
        console.error("[outreach GET]", err);
        return NextResponse.json({ success: false, error: "Failed to load prospects." }, { status: 500 });
    }
}

// POST — add prospects + send step 1.
// Skips dupes (active prospect = no-op, never restart), unsubscribed/stopped addresses.
export async function POST(req) {
    const token = await auth(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const body = await req.json();
        const shopName = (body.shopName || "").trim();
        const firstName = (body.firstName || "").trim();
        const emails = parseEmails(body.emails);
        if (!shopName) return NextResponse.json({ error: "Shop name required" }, { status: 400 });
        if (!emails.length) return NextResponse.json({ error: "No valid emails" }, { status: 400 });

        const createdBy = token.email || token.userName || token.name || "admin";
        const step1 = getStep(1);

        let created = 0;
        const skipped = [];

        for (const email of emails) {
            const existing = await OutreachProspect.findOne({ email }).lean();
            if (existing) {
                // Active/replied/completed → no-op; never restart a sequence. Unsub/stopped → respect.
                skipped.push({ email, reason: existing.status });
                continue;
            }

            const unsubToken = crypto.randomBytes(16).toString("hex");
            // Create FIRST (atomic on unique email) so a concurrent re-add can't duplicate.
            let doc;
            try {
                doc = await OutreachProspect.create({
                    email, shopName, firstName,
                    status: "active", step: 0, unsubToken, createdBy,
                });
            } catch (e) {
                if (e?.code === 11000) { skipped.push({ email, reason: "exists" }); continue; }
                throw e;
            }

            const res = await sendOutreachStep({ to: email, step: 1, firstName, shopName, unsubToken });
            if (!res.ok) {
                // Sending failed — leave at step 0 so dispatch can retry the first step.
                console.error(`[outreach] step1 send failed for ${email}:`, res.error);
                skipped.push({ email, reason: `send-failed: ${res.error}` });
                continue;
            }

            doc.step = 1;
            doc.nextSendAt = nextSendDate(1); // +3d (step 2 interval)
            doc.history.push({ step: 1, sentAt: new Date(), messageId: res.id || "", subject: res.subject || step1?.subject || "" });
            await doc.save();
            created++;
        }

        return NextResponse.json({ success: true, created, skipped });
    } catch (err) {
        console.error("[outreach POST]", err);
        return NextResponse.json({ success: false, error: "Failed to add prospects." }, { status: 500 });
    }
}

// PATCH — row actions: replied | stopped | sendNext.
export async function PATCH(req) {
    const token = await auth(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id, action } = await req.json();
        if (!id || !action) return NextResponse.json({ error: "Missing id/action" }, { status: 400 });

        const doc = await OutreachProspect.findById(id);
        if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (action === "replied") {
            doc.status = "replied";
            doc.nextSendAt = null;
            await doc.save();
            return NextResponse.json({ success: true });
        }
        if (action === "stopped") {
            doc.status = "stopped";
            doc.nextSendAt = null;
            await doc.save();
            return NextResponse.json({ success: true });
        }
        if (action === "sendNext") {
            if (doc.status !== "active") {
                return NextResponse.json({ error: `Prospect is ${doc.status}` }, { status: 400 });
            }
            const nextStep = (doc.step || 0) + 1;
            const def = getStep(nextStep);
            if (!def) {
                doc.status = "completed";
                doc.nextSendAt = null;
                await doc.save();
                return NextResponse.json({ success: true, completed: true });
            }
            // Claim atomically: bump step BEFORE send so a concurrent dispatch can't double-send.
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
                return NextResponse.json({ success: true, step: nextStep });
            }
            return NextResponse.json({ success: false, error: res.error, step: nextStep });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("[outreach PATCH]", err);
        return NextResponse.json({ success: false, error: "Failed to update prospect." }, { status: 500 });
    }
}
