export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Tutorial } from "@pythias/mongo";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // optional filter
    const query = type ? { videoType: type } : {};
    const tutorials = await Tutorial.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ tutorials });
}

export async function POST(req) {
    const body = await req.json();
    const { videoUrl, videoType = "tutorial" } = body;

    if (!videoUrl) return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });

    // Type-specific required field validation
    if (videoType === "tutorial"    && (!body.title || !body.category)) return NextResponse.json({ error: "title and category required" }, { status: 400 });
    if (videoType === "testimonial" && !body.customerName)              return NextResponse.json({ error: "customerName required" }, { status: 400 });
    if (videoType === "demo"        && !body.title)                     return NextResponse.json({ error: "title required" }, { status: 400 });
    if (videoType === "page-video"  && (!body.title || !body.targetPage)) return NextResponse.json({ error: "title and targetPage required" }, { status: 400 });

    const tutorial = await Tutorial.create(body);
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
