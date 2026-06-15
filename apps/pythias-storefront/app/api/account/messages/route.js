export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSupportThread } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

function shape(t) {
    return {
        id: String(t._id),
        subject: t.subject,
        status: t.status,
        orderId: t.orderId ? String(t.orderId) : null,
        lastMessageAt: t.lastMessageAt,
        messages: (t.messages ?? []).map((m) => ({ from: m.from, body: m.body, at: m.at })),
    };
}

// GET /api/account/messages — the customer's support threads.
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const threads = await StorefrontSupportThread.find({ orgId: auth.orgId, customerId: auth.customer._id })
        .sort({ lastMessageAt: -1 }).limit(100).lean();
    return NextResponse.json({ error: false, threads: threads.map(shape) });
}

// POST /api/account/messages — start a thread. Body: { subject?, body, orderId? }
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const b = await req.json().catch(() => null);
    const body = b?.body?.toString().trim();
    if (!body) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    const orderId = b?.orderId && mongoose.Types.ObjectId.isValid(b.orderId) ? b.orderId : undefined;

    const now = new Date();
    const thread = await StorefrontSupportThread.create({
        orgId: auth.orgId,
        customerId: auth.customer._id,
        subject: b?.subject?.toString().trim() || "Customer inquiry",
        orderId,
        messages: [{ from: "customer", body, at: now }],
        lastMessageAt: now,
    });
    return NextResponse.json({ error: false, thread: shape(thread) }, { status: 201 });
}
