export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { generateArticle } from "@pythias/backend";
import { PYTHIAS_BRAND } from "@/lib/pythiasBrand";
import { generateArticleImage } from "@/lib/articleImage";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { topic, model, publish } = await req.json().catch(() => ({}));
    if (!topic?.trim()) return NextResponse.json({ error: true, msg: "topic is required" }, { status: 400 });

    let generated;
    try {
        generated = await generateArticle({ topic: topic.trim(), brand: PYTHIAS_BRAND, options: { model } });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }

    // Ensure a unique slug.
    let slug = generated.slug || "article";
    let n = 1;
    while (await Article.findOne({ slug })) slug = `${generated.slug}-${++n}`;

    // Branded AI cover image relating to the topic (fail-soft — null if Gemini key/render unavailable).
    const coverImage = await generateArticleImage({ topic: generated.title || topic.trim() }).catch(() => null);

    const doc = await Article.create({
        title: generated.title,
        slug,
        metaDescription: generated.metaDescription,
        excerpt: generated.excerpt,
        content: generated.content,
        tags: generated.tags,
        author: generated.author,
        faqJsonLd: generated.faqJsonLd,
        coverImage: coverImage || "",
        published: Boolean(publish), // default false — created as a draft for review
        ...(publish ? { publishedAt: new Date() } : {}),
    });

    return NextResponse.json({ error: false, article: doc });
}
