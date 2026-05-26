import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
    const {
        imageUrl,
        designName,
        designDescription = "",
        blankDescriptions = [],
        blanks = [],
        maxColors = 4,
        brand = "",
        marketplaces = [],
    } = await req.json();

    // Download design image server-side so OpenAI can access private CDN URLs
    let imageContent = null;
    if (imageUrl) {
        try {
            const res = await fetch(imageUrl);
            if (res.ok) {
                const buf = Buffer.from(await res.arrayBuffer());
                const mime = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
                imageContent = {
                    type: "image_url",
                    image_url: { url: `data:${mime};base64,${buf.toString("base64")}`, detail: "high" },
                };
            }
        } catch { /* skip if image unavailable */ }
    }

    const blankColorList = blanks.map(b =>
        `Blank "${b.blankName}" (id: ${b.blankId}):\n` +
        b.colors.map(c => `  - ${c.name}${c.hexcode ? ` (#${c.hexcode.replace("#", "")})` : ""} [id: ${c._id}] (compatibility score: ${c.score ?? "?"})`).join("\n")
    ).join("\n\n");


    const marketplaceSection = marketplaces.length > 0
        ? `\nMarketplaces needing listings:\n${marketplaces.map(m => {
            const dropEntries = Object.entries(m.dropDowns ?? {});
            const fieldLines = dropEntries.length > 0
                ? `\n  Selectable fields — pick the single best-matching option from each list; omit the field (do not include it) if no option clearly fits:\n${dropEntries.map(([field, opts]) => `  - ${field}: [${Array.isArray(opts) ? opts.join(", ") : ""}]`).join("\n")}`
                : "";
            return `- ${m.name}${fieldLines}`;
        }).join("\n")}`
        : "";

    const extraContext = [
        designDescription && `Design description: "${designDescription}"`,
        blankDescriptions.length > 0 && `Garment descriptions:\n${blankDescriptions.map(d => `- ${d}`).join("\n")}`,
        brand && `Brand: "${brand}"`,
    ].filter(Boolean).join("\n");

    const marketplaceDataSchema = marketplaces.length > 0 ? `,
  "marketplaceData": {
    "<marketplaceName>": {
      "title": "<marketplace-optimized title>",
      "description": "<marketplace-specific description>",
      "tags": ["<tag1>", ..., "<tag10>"],
      "<fieldName>": "<selected option from that field's list — include only fields with a clear match>"
    }
  }` : "";

    const prompt = `You are an expert print-on-demand product manager. Analyze the design image and select the best garment colors for each blank, then generate product copy.

Design name: "${designName}"${extraContext ? `\n${extraContext}` : ""}
Max colors per blank: ${maxColors}

Available blanks and their colors:
${blankColorList}${marketplaceSection}

Color selection rules (HARD RULES — never violate):
- Analyze the design image carefully and identify ALL significant colors present (not just the dominant one)
- NEVER select a garment color that matches or is very similar to ANY significant color in the design — if green appears anywhere prominently in the design, do not select a green garment; if red appears, avoid red garments; and so on
- NEVER select a dark or black garment when the design is predominantly dark or black
- NEVER select a white or near-white garment when the design is predominantly white or very light
- For light/white designs: ONLY pick dark garments (black, navy, charcoal, forest green, dark gray)
- For dark/black designs: ONLY pick light garments (white, light gray, cream, light blue, natural)
- For multicolor designs: avoid any garment color that appears as a significant portion of the design; prefer neutral garments (white, black, gray, navy) so all design colors pop
- Each color has a pre-computed compatibility score (1–10). Strongly prefer colors with the highest scores — only pick a lower-scored color if higher-scored options are exhausted or too similar to each other
- Pick exactly ${maxColors} colors per blank (or fewer if fewer are available), ordered best to worst score
- Prefer variety — don't pick 4 similar shades of the same color family
Return ONLY a valid JSON object, no markdown:
{
  "blanks": [
    {
      "blankId": "<id>",
      "selectedColorIds": ["<colorId>", ...],
      "reasoning": "<one sentence explaining the color choices>"
    }
  ],
  "product": {
    "title": "<compelling product title>",
    "description": "<product description of at least 4 sentences combining the design theme and garment details>",
    "tags": ["<tag1>", ..., "<tag10>"],
    "gender": "<Mens|Womens|Unisex|Kids>",
    "category": ["<cat1>", "<cat2>"]
  }${marketplaceDataSchema}
}`;

    const content = [];
    if (imageContent) content.push(imageContent);
    content.push({ type: "text", text: prompt });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content }],
            max_tokens: 3000,
            response_format: { type: "json_object" },
        });
        return NextResponse.json(JSON.parse(response.choices[0].message.content));
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
