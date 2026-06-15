export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { generateArticleIdeas } from "@pythias/backend";
import { PYTHIAS_BRAND } from "@/lib/pythiasBrand";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { count, model } = await req.json().catch(() => ({}));

    // Avoid duplicating existing posts.
    const existing = await Article.find().select("title").limit(200).lean();
    const avoidTitles = existing.map((a) => a.title).filter(Boolean);

    try {
        const ideas = await generateArticleIdeas({
            brand: PYTHIAS_BRAND,
            options: { count: count || 10, model, avoidTitles },
        });
        return NextResponse.json({ error: false, ideas });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
