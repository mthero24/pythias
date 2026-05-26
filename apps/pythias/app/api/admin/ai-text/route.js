import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
    });
    return NextResponse.json({ content: response.choices[0].message.content });
}
