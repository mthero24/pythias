import { NextResponse } from "next/server";
import { ForumThread, ForumReply } from "@/models/Forum";

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { body, authorName, authorEmail } = await req.json();
        if (!body?.trim() || !authorName?.trim() || !authorEmail?.trim())
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail))
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });

        const thread = await ForumThread.findById(id);
        if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        if (thread.locked) return NextResponse.json({ error: "Thread is locked" }, { status: 403 });

        const [reply] = await Promise.all([
            ForumReply.create({ threadId: id, body: body.trim(), authorName: authorName.trim(), authorEmail }),
            ForumThread.findByIdAndUpdate(id, { $inc: { replyCount: 1 }, lastActivityAt: new Date() }),
        ]);

        const { authorEmail: _, ...safe } = reply.toObject();
        return NextResponse.json({ reply: safe }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
