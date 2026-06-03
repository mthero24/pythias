import OpenAI from 'openai';
import { NextApiRequest, NextResponse } from "next/server";
import { AiBlacklist } from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    let openai = new OpenAI({
        apiKey: process.env["OPENAI_API_KEY"],
    });

    const blacklistItems = await AiBlacklist.find({}).lean();
    const banned = blacklistItems.map(i => i.name).filter(Boolean);

    let prompt = `${data.prompt}`;
    if (banned.length > 0) {
        prompt += ` Do NOT use any of the following words or phrases in the description or tags: ${banned.map(b => `"${b}"`).join(", ")}.`;
    }

    // Build message content — include image for vision if provided
    const content = [];
    if (data.imageUrl) {
        // Download the image server-side so OpenAI can access private CDN URLs
        try {
            const imgRes = await fetch(data.imageUrl);
            if (imgRes.ok) {
                const buf = Buffer.from(await imgRes.arrayBuffer());
                const b64 = buf.toString("base64");
                const mime = (imgRes.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
                content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${b64}`, detail: "low" } });
            }
        } catch { /* skip image if fetch fails */ }
    }
    content.push({ type: "text", text: prompt });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        max_tokens: 600,
    });
    return NextResponse.json(response.choices[0].message.content);
}
