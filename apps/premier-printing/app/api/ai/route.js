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

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: [{ type: "text", text: prompt }],
            },
        ],
        max_tokens: 300,
    });
    return NextResponse.json(response.choices[0].message.content);
}
