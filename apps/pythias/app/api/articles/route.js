export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article } from "@pythias/mongo";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const tag   = searchParams.get("tag");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const page  = Math.max(parseInt(searchParams.get("page")  || "1"), 1);

    const query = { published: true };
    if (tag) query.tags = tag;

    const [articles, total] = await Promise.all([
        Article.find(query)
            .sort({ publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("title slug excerpt author tags coverImage publishedAt"),
        Article.countDocuments(query),
    ]);

    return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}
