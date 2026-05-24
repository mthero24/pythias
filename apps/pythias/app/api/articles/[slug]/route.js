export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article } from "@pythias/mongo";

export async function GET(req, { params }) {
    const article = await Article.findOne({ slug: params.slug, published: true });
    if (!article) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
    return NextResponse.json({ article });
}
