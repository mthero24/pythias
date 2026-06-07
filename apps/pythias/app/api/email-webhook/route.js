import { NextResponse } from "next/server";
import { EmailEvent } from "@pythias/mongo";
import crypto from "crypto";

// Svix signature verification without the svix package.
// Resend signs webhooks using HMAC-SHA256 over "<svix-id>.<svix-timestamp>.<raw-body>".
// The secret is Base64-encoded after the "whsec_" prefix.
async function verifySignature(req, rawBody) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return true; // skip verification if secret not configured

    const msgId     = req.headers.get("svix-id");
    const timestamp = req.headers.get("svix-timestamp");
    const signature = req.headers.get("svix-signature");

    if (!msgId || !timestamp || !signature) return false;

    let secretBytes;
    try {
        secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    } catch {
        return false;
    }

    const toSign = `${msgId}.${timestamp}.${rawBody}`;
    const computed = "v1," + crypto
        .createHmac("sha256", secretBytes)
        .update(toSign)
        .digest("base64");

    // The header can contain multiple space-separated signatures (v1,<sig>)
    return signature.split(" ").some(sig => {
        try {
            const a = Buffer.from(computed);
            const b = Buffer.from(sig);
            return a.length === b.length && crypto.timingSafeEqual(a, b);
        } catch {
            return false;
        }
    });
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
    const email      = Array.isArray(data?.to) ? data.to[0] : data?.to;
    const resendId   = data?.email_id;
    const subject    = data?.subject || "";
    const link       = data?.click?.link || "";
    const occurredAt = created_at ? new Date(created_at) : new Date();

    if (["email.opened", "email.clicked", "email.delivered", "email.bounced"].includes(type)) {
        await EmailEvent.create({ resendId, type, email, subject, link, occurredAt });
    }

    return NextResponse.json({ received: true });
}
