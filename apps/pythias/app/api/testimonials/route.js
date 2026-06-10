export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Tutorial } from "@pythias/mongo";

export async function GET() {
    const testimonials = await Tutorial.find({ videoType: "testimonial", published: true })
        .sort({ order: 1, createdAt: -1 })
        .select("customerName company role rating videoUrl thumbnailUrl description")
        .lean();
    return NextResponse.json({ testimonials });
}
