export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Tutorial } from "@pythias/mongo";

export async function GET() {
    const tutorials = await Tutorial.find().sort({ category: 1, order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ tutorials });
}

export async function POST(req) {
    const body = await req.json();
    const { title, description, category, videoUrl, thumbnailUrl, order } = body;
    if (!title || !category || !videoUrl) {
        return NextResponse.json({ error: "title, category, and videoUrl are required" }, { status: 400 });
    }
    const tutorial = await Tutorial.create({ title, description, category, videoUrl, thumbnailUrl, order: order ?? 0 });
    return NextResponse.json({ tutorial });
}

export async function PATCH(req) {
    const body = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const tutorial = await Tutorial.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json({ tutorial });
}

export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await Tutorial.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
}
