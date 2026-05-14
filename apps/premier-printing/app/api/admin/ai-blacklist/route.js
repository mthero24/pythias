import { NextResponse } from "next/server";
import { AiBlacklist } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export async function GET() {
    const items = await AiBlacklist.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ items });
}

export async function POST(req) {
    const { phrase } = await req.json();
    if (!phrase?.trim()) return NextResponse.json({ error: true, msg: "Phrase is required" }, { status: 400 });
    const existing = await AiBlacklist.findOne({ name: phrase.trim() });
    if (existing) return NextResponse.json({ error: true, msg: "Already in blacklist" }, { status: 400 });
    const item = await AiBlacklist.create({ name: phrase.trim() });
    return NextResponse.json({ item });
}

export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: true, msg: "ID required" }, { status: 400 });
    await AiBlacklist.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}
