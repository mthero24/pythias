import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ hasModel: false });
    try {
        const res = await fetch(imageUrl);
        if (!res.ok) return NextResponse.json({ hasModel: false });
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: [
                    { type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}`, detail: "low" } },
                    { type: "text", text: 'Does this image contain a person (human model wearing clothing)? Reply with only "yes" or "no".' },
                ],
            }],
            max_tokens: 5,
        });
        const answer = (response.choices[0].message.content ?? "").toLowerCase().trim();
        return NextResponse.json({ hasModel: answer.startsWith("yes") });
    } catch {
        return NextResponse.json({ hasModel: false });
    }
}
