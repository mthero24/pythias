import OpenAI from "openai";
import { Blank } from "@pythias/mongo";
export const maxDuration = 300;

async function classifyImage(imageUrl) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return false;
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
        return (response.choices[0].message.content ?? "").toLowerCase().trim().startsWith("yes");
    } catch {
        return false;
    }
}

export async function POST() {
    const encoder = new TextEncoder();
    const line = (obj) => encoder.encode(JSON.stringify(obj) + "\n");

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const blanks = await Blank.find({}).select("_id code images").lean();
                const totalBlanks = blanks.length;
                controller.enqueue(line({ type: "start", blanks: totalBlanks }));

                let totalChecked = 0, totalMigrated = 0, totalUpdated = 0;

                for (let bi = 0; bi < blanks.length; bi++) {
                    const blank = blanks[bi];

                    // Migrate images already tagged imageGroup:"model" — no AI needed
                    const toMigrate = (blank.images ?? []).filter(img =>
                        img.image && img.imageGroup === "model" && !img.isModel
                    );
                    if (toMigrate.length > 0) {
                        await Promise.all(toMigrate.map(img =>
                            Blank.updateOne(
                                { _id: blank._id, "images._id": img._id },
                                { $set: { "images.$.isModel": true }, $unset: { "images.$.imageGroup": "" } }
                            )
                        ));
                        totalMigrated += toMigrate.length;
                        controller.enqueue(line({ type: "progress", blank: blank.code, migrated: toMigrate.length }));
                    }

                    // Run AI classifier on images not yet classified
                    const candidates = (blank.images ?? []).filter(img =>
                        img.image && img.imageGroup !== "model" && !img.isModel
                    );
                    if (candidates.length === 0) continue;

                    const toUpdate = [];
                    for (let i = 0; i < candidates.length; i += 8) {
                        const batch = candidates.slice(i, i + 8);
                        const results = await Promise.all(
                            batch.map(async img => ({ img, hasModel: await classifyImage(img.image) }))
                        );
                        for (const { img, hasModel } of results) {
                            totalChecked++;
                            if (hasModel) toUpdate.push(img._id);
                        }
                    }

                    if (toUpdate.length > 0) {
                        await Promise.all(toUpdate.map(imgId =>
                            Blank.updateOne(
                                { _id: blank._id, "images._id": imgId },
                                { $set: { "images.$.isModel": true } }
                            )
                        ));
                        totalUpdated += toUpdate.length;
                        controller.enqueue(line({ type: "progress", blank: blank.code, updated: toUpdate.length }));
                    }
                }

                controller.enqueue(line({ type: "done", totalChecked, totalMigrated, totalUpdated }));
            } catch (err) {
                controller.enqueue(line({ type: "error", message: err.message }));
            }
            controller.close();
        },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
