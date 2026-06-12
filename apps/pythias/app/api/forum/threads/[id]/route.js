import { NextResponse } from "next/server";
import { ForumThread, ForumReply } from "@/models/Forum";

export async function GET(req, { params }) {
    const { id } = await params;
    const [thread, replies] = await Promise.all([
        ForumThread.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
            .select("-authorEmail").lean(),
        ForumReply.find({ threadId: id }).sort({ createdAt: 1 }).select("-authorEmail").lean(),
    ]);
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ thread, replies });
}
