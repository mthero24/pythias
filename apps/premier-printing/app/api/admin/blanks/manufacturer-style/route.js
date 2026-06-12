import { NextResponse } from "next/server";
import { Blank } from "@pythias/mongo";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function askClaude(name) {
    const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{
            role: "user",
            content: `You are an expert in wholesale blank apparel used in the print-on-demand industry.

Given this blank product name: "${name}"

If you are confident about the manufacturer brand and style number, reply with ONLY:
CONFIDENT: Brand StyleNumber
(example: CONFIDENT: Comfort Colors 1717)

If you are not sure but have 2-3 likely candidates, reply with ONLY:
OPTIONS: Brand StyleNumber, Brand StyleNumber, Brand StyleNumber
(example: OPTIONS: Comfort Colors 1566, Independent Trading SS4500, Gildan 18000)

If you have no idea, reply with exactly:
UNKNOWN`,
        }],
    });

    const text = msg.content?.[0]?.text?.trim() ?? "";

    if (text.startsWith("CONFIDENT:")) {
        return { confident: true, manufacturerStyle: text.replace("CONFIDENT:", "").trim() };
    }
    if (text.startsWith("OPTIONS:")) {
        const options = text.replace("OPTIONS:", "").split(",").map(s => s.trim()).filter(Boolean);
        return { confident: false, options };
    }
    return null;
}

export async function POST(req) {
    const { blankId, all } = await req.json();

    if (all) {
        const blanks = await Blank.find({ manufacturerStyle: { $in: [null, ""] }, name: { $nin: [null, ""] } })
            .select("_id name").lean();

        let updated = 0;
        for (const b of blanks) {
            try {
                const result = await askClaude(b.name);
                if (result?.confident) {
                    await Blank.updateOne({ _id: b._id }, { $set: { manufacturerStyle: result.manufacturerStyle } });
                    updated++;
                }
            } catch { /* skip */ }
        }
        return NextResponse.json({ updated, total: blanks.length });
    }

    if (!blankId) return NextResponse.json({ error: "blankId required" }, { status: 400 });

    const blank = await Blank.findById(blankId).select("name").lean();
    if (!blank?.name) return NextResponse.json({ manufacturerStyle: null, msg: "No name set on blank" });

    try {
        const result = await askClaude(blank.name);
        if (!result) return NextResponse.json({ manufacturerStyle: null, msg: "Could not identify — enter manually" });
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ manufacturerStyle: null, msg: "Lookup failed" });
    }
}
