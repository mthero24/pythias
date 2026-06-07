import { NextResponse } from "next/server";
import { EmailEvent } from "@pythias/mongo";

// Resend delivers webhooks signed via Svix headers.
// Verify using the webhook secret from the Resend dashboard.
async function verifySignature(req, body) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return true; // skip verification if secret not configured

    const svixId        = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) return false;

    try {
        const { Webhook } = await import("svix");
        const wh = new Webhook(secret);
        wh.verify(body, { "svix-id": svixId, "svix-timestamp": svixTimestamp, "svix-signature": svixSignature });
        return true;
    } catch {
        return false;
    }
}

export async function POST(req) {
    const body = await req.text();

    if (!await verifySignature(req, body)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
        event = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { type, data, created_at } = event;
    const email   = Array.isArray(data?.to) ? data.to[0] : data?.to;
    const resendId = data?.email_id;
    const subject  = data?.subject || "";
    const link     = data?.click?.link || "";
    const occurredAt = created_at ? new Date(created_at) : new Date();

    // Only store event types we care about — skip duplicates for opens
    if (["email.opened", "email.clicked", "email.delivered", "email.bounced"].includes(type)) {
        await EmailEvent.create({ resendId, type, email, subject, link, occurredAt });
    }

    return NextResponse.json({ received: true });
}
