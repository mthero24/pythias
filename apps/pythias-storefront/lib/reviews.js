import { StorefrontReview, StorefrontReviewSummary } from "@pythias/mongo";

// Recompute a product's cached rating rollup from its published reviews, and (best-effort)
// regenerate the AI summary when enough new reviews have accumulated.
export async function recomputeSummary(orgId, productId) {
    const [agg] = await StorefrontReview.aggregate([
        { $match: { orgId, productId, status: "published" } },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$rating" },
            d1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
            d2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            d3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            d4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            d5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        } },
    ]);
    const count = agg?.count || 0;
    const avg = count ? Math.round((agg.sum / count) * 10) / 10 : 0;
    const distribution = { 1: agg?.d1 || 0, 2: agg?.d2 || 0, 3: agg?.d3 || 0, 4: agg?.d4 || 0, 5: agg?.d5 || 0 };

    await StorefrontReviewSummary.updateOne(
        { orgId, productId },
        { $set: { avg, count, distribution } },
        { upsert: true }
    );

    // Regenerate AI highlights every time count grows by 3+ (fire-and-forget; don't slow the caller).
    const summary = await StorefrontReviewSummary.findOne({ orgId, productId }).lean();
    if (count >= 3 && count >= (summary?.aiAtCount || 0) + 3) {
        generateAISummary(orgId, productId, count).catch(() => {});
    }
    return { avg, count, distribution };
}

// AI pros/cons + one-line summary from recent reviews. Degrades silently without a key.
async function generateAISummary(orgId, productId, count) {
    if (!process.env.ANTHROPIC_API_KEY) return;
    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; } catch { return; }

    const reviews = await StorefrontReview.find({ orgId, productId, status: "published" })
        .sort({ createdAt: -1 }).limit(50).select("rating title body").lean();
    if (!reviews.length) return;

    const corpus = reviews.map((r) => `(${r.rating}/5) ${r.title || ""} ${r.body || ""}`.trim()).join("\n").slice(0, 8000);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 700,
        thinking: { type: "adaptive" },
        messages: [{ role: "user", content: `Summarize these product reviews for shoppers. Return STRICT JSON {"summary":"one neutral sentence","pros":["..."],"cons":["..."]} (max 4 pros, 4 cons), nothing else.\n\n${corpus}` }],
    });
    const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    await StorefrontReviewSummary.updateOne({ orgId, productId }, { $set: {
        aiSummary: json.summary || "", aiPros: (json.pros || []).slice(0, 4), aiCons: (json.cons || []).slice(0, 4), aiAtCount: count,
    } });
}
