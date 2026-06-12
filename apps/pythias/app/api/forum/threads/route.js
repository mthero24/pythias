import { NextResponse } from "next/server";
import { ForumThread } from "@/models/Forum";

const VALID_CATEGORIES = ["production-tips", "business-sales", "problems-troubleshooting", "wins-announcements"];
const PAGE_SIZE = 20;

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));

    const filter = category && VALID_CATEGORIES.includes(category) ? { category } : {};
    const [threads, total] = await Promise.all([
        ForumThread.find(filter)
            .sort({ pinned: -1, lastActivityAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .select("-authorEmail")
            .lean(),
        ForumThread.countDocuments(filter),
    ]);

    return NextResponse.json({ threads, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

export async function POST(req) {
    try {
        const { title, body, category, authorName, authorEmail } = await req.json();
        if (!title?.trim() || !body?.trim() || !authorName?.trim() || !authorEmail?.trim())
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        if (!VALID_CATEGORIES.includes(category))
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail))
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });

        const thread = await ForumThread.create({ title: title.trim(), body: body.trim(), category, authorName: authorName.trim(), authorEmail });
        const { authorEmail: _, ...safe } = thread.toObject();
        return NextResponse.json({ thread: safe }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
