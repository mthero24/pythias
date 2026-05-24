export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Article, WebhookToken } from "@pythias/mongo";

export async function POST(req) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();

    const record = await WebhookToken.findOne({ token, type: "articles", active: true });
    if (!record) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    // Update last used timestamp (don't await — keep response fast)
    WebhookToken.findByIdAndUpdate(record._id, { lastUsedAt: new Date() }).exec();

    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: true, msg: "Invalid JSON" }, { status: 400 });
    }

    try {
        const doc = {
            title:           data.title,
            slug:            data.slug,
            content:         data.content_html || data.content_markdown || "",
            excerpt:         data.metaDescription || "",
            metaDescription: data.metaDescription || "",
            coverImage:      data.heroImageUrl || "",
            jsonLd:          data.jsonLd || null,
            faqJsonLd:       data.faqJsonLd || null,
            languageCode:    data.languageCode || "en",
            externalId:      data.id || null,
            externalUrl:     data.publicUrl || "",
            published:       true,
            publishedAt:     data.createdAt ? new Date(data.createdAt) : new Date(),
        };

        await Article.findOneAndUpdate(
            { slug: doc.slug },
            { $set: doc },
            { upsert: true, new: true }
        );

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Article webhook error:", err);
        // Always return 200 so the sender doesn't retry endlessly
        return NextResponse.json({ received: true, warning: err.message });
    }
}
