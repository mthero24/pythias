import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import OpenAI from "openai";

const PROMPT = `You are analyzing a design image (e.g. a print-on-demand graphic, t-shirt design).

Extract every visible text block. For each one return a JSON object with these fields:
- text: the exact string as it appears (preserve casing and punctuation)
- x_pct: left edge as fraction of image width (0.0–1.0)
- y_pct: TOP edge as fraction of image height (0.0–1.0) — this is the TOP of the text, NOT the bottom
- w_pct: width as fraction of image width (0.0–1.0)
- h_pct: height as fraction of image height (0.0–1.0)
- color_hex: best estimate of the text fill color (e.g. "#000000")
- is_bold: boolean
- is_italic: boolean
- is_all_caps: boolean
- font_style: one of "sans-serif", "serif", "script", "handwritten", "display"

Return ONLY a JSON array. No markdown, no explanation. Example:
[{"text":"Happy Birthday","x_pct":0.1,"y_pct":0.05,"w_pct":0.8,"h_pct":0.15,"color_hex":"#ffffff","is_bold":true,"is_italic":false,"is_all_caps":false,"font_style":"display"}]`;

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 403 });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: true, msg: "imageBase64 required" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    // Strip any accidental markdown fences
    const json = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    const blocks = JSON.parse(json);

    return NextResponse.json({ error: false, blocks });
  } catch (e) {
    console.error("[extract-text]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
