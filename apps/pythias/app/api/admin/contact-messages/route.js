import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ContactMessage, LeadSequence } from "@pythias/mongo";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return !!token;
}

export async function GET(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const messages  = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
        const emails    = [...new Set(messages.map(m => m.email?.toLowerCase()).filter(Boolean))];
        const sequences = await LeadSequence.find({ email: { $in: emails } }).lean();
        const seqMap    = Object.fromEntries(sequences.map(s => [s.email, s]));

        const enriched = messages.map(m => ({
            ...m,
            sequence: seqMap[m.email?.toLowerCase()] ?? null,
        }));

        return NextResponse.json({ success: true, messages: enriched });
    } catch (err) {
        console.error("Contact messages GET error:", err);
        return NextResponse.json({ success: false, error: "Failed to load messages." }, { status: 500 });
    }
}

export async function DELETE(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const id = req.nextUrl.searchParams.get("id");
        await ContactMessage.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to delete message." }, { status: 500 });
    }
}

export async function PATCH(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const body = await req.json();
        const { id, action } = body;

        if (action === "pause" || action === "resume") {
            const msg = await ContactMessage.findById(id).lean();
            if (msg?.email) {
                await LeadSequence.updateOne(
                    { email: msg.email.toLowerCase() },
                    { $set: { paused: action === "pause" } }
                );
            }
            return NextResponse.json({ success: true });
        }

        const update = {};
        if (body.read  !== undefined) update.read  = body.read;
        if (body.notes !== undefined) update.notes = body.notes;

        await ContactMessage.findByIdAndUpdate(id, update);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Contact messages PATCH error:", err);
        return NextResponse.json({ success: false, error: "Failed to update message." }, { status: 500 });
    }
}
