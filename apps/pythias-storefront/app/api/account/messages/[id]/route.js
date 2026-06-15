export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSupportThread } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// POST /api/account/messages/[id] — customer replies on an existing thread. Body: { body }
export async function POST(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const b = await req.json().catch(() => null);
    const body = b?.body?.toString().trim();
    if (!body) return NextResponse.json({ error: "Message body is required" }, { status: 400 });

    const now = new Date();
    const res = await StorefrontSupportThread.updateOne(
        { _id: id, orgId: auth.orgId, customerId: auth.customer._id },
        { $push: { messages: { from: "customer", body, at: now } }, $set: { lastMessageAt: now, status: "open" } }
    );
    if (!res.matchedCount) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    return NextResponse.json({ error: false });
}
