export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

function toSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page  = Math.max(parseInt(searchParams.get("page")  || "1"), 1);

    const [articles, total] = await Promise.all([
        Article.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Article.countDocuments(),
    ]);

    return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.slug) data.slug = toSlug(data.title);
    if (data.published && !data.publishedAt) data.publishedAt = new Date();

    const article = await Article.create(data);
    return NextResponse.json({ error: false, article });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { _id, ...update } = data;
    if (update.published && !update.publishedAt) update.publishedAt = new Date();

    const article = await Article.findByIdAndUpdate(_id, update, { new: true });
    return NextResponse.json({ error: false, article });
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Article.findByIdAndDelete(id);
    return NextResponse.json({ error: false });
}
