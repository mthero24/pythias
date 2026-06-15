// Reusable AI article generator — grounded, guardrailed, brand-agnostic.
//
// Used by the Pythias marketing blog now, and reusable for Storefront Cloud sellers
// (pass each seller's store as the `brand` context). The guardrails (no fabricated stats,
// no competitor disparagement, facts only from brand context) are baked into the system
// prompt so generated content can't repeat the BabyLove-Growth failure modes.
//
// Requires ANTHROPIC_API_KEY. Model defaults to claude-opus-4-8 (override via the `model`
// option or CONTENT_AI_MODEL env, e.g. claude-sonnet-4-6 for cheaper bulk generation).

const DEFAULT_MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are an expert SEO content writer producing accurate, genuinely useful blog articles for a specific business.

Follow these rules without exception:
1. NEVER invent statistics, percentages, dollar figures, growth numbers, time savings, or any quantitative claim. If you don't have a sourced number, write qualitatively ("can reduce manual work", never "reduces manual work by 60%").
2. NEVER state a performance claim about the business (e.g. "X% revenue increase", "ships N times faster") unless that exact fact appears verbatim in <brand_facts>.
3. NEVER name, rank, review, or disparage competitors or other named companies/products. No "alternatives to X", no "X has shipping delays", no comparison tables of named rivals.
4. ONLY assert facts about the business that appear in <brand_facts>. Everything else must be general, industry-accurate, educational content.
5. Write for humans first: clear, specific, genuinely helpful. No fluff, no keyword stuffing, no AI cliches.
6. Naturally weave in internal links from <internal_links> where genuinely relevant — use the exact href with a descriptive anchor. Never force a link that doesn't fit, and never invent URLs.
7. The body must be valid semantic HTML using ONLY these tags: <h2>, <h3>, <p>, <ul>, <li>, <a>, <strong>, <em>. No <h1> (the title renders separately), no inline styles, no scripts, no images.
8. Respond with ONLY a single JSON object — no markdown code fences, no commentary before or after.`;

export async function generateArticle({ topic, brand = {}, options = {} }) {
    if (!topic || !String(topic).trim()) throw new Error("topic is required");
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; }
    catch { throw new Error("@anthropic-ai/sdk not installed"); }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const model    = options.model || process.env.CONTENT_AI_MODEL || DEFAULT_MODEL;
    const maxWords = options.maxWords || 1100;
    const byline   = options.byline || brand.byline || brand.name || "Editorial Team";
    const voice    = brand.voice || "professional, clear, and helpful";
    const facts    = (brand.facts || []).map((f) => `- ${f}`).join("\n") || "- (no specific business facts provided — keep all business claims general)";
    const links    = (brand.internalLinks || []).map((l) => `- ${l.label}: ${l.href}`).join("\n") || "- (none)";

    const userPrompt = `Write an SEO blog article on this topic:

<topic>${topic}</topic>

<brand>
Name: ${brand.name || "the business"}
What it does: ${brand.description || ""}${brand.url ? `\nWebsite: ${brand.url}` : ""}
Voice: ${voice}
</brand>

<brand_facts>
${facts}
</brand_facts>

<internal_links>
${links}
</internal_links>

Requirements:
- Around ${maxWords} words.
- Helpful, accurate, educational. Mention ${brand.name || "the business"} naturally where relevant (only using <brand_facts>), with a soft call to action near the end.
- ${options.includeFaq === false ? "Do not include an FAQ." : "Include 3-4 FAQ question/answer pairs."}

Respond with ONLY this JSON object:
{
  "title": "compelling, specific, <= 70 chars",
  "slug": "url-safe-kebab-case",
  "metaDescription": "<= 155 chars, includes the primary keyword",
  "excerpt": "1-2 sentence summary",
  "tags": ["3-6 relevant tags"],
  "contentHtml": "the full article body as valid HTML (h2/h3/p/ul/li/a/strong/em only)",
  "faq": [{ "q": "question", "a": "answer" }]
}`;

    const res = await client.messages.create({
        model,
        max_tokens: options.maxTokens || 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
    });

    const text = (res?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const obj = extractJson(text);
    if (!obj || !obj.title || !obj.contentHtml) throw new Error("AI did not return a valid article");

    const slug = slugify(obj.slug || obj.title);
    const faq = Array.isArray(obj.faq) ? obj.faq.filter((f) => f && f.q && f.a) : [];
    const faqJsonLd = faq.length
        ? {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }
        : undefined;

    return {
        title: String(obj.title).trim(),
        slug,
        metaDescription: String(obj.metaDescription || obj.excerpt || "").trim().slice(0, 160),
        excerpt: String(obj.excerpt || "").trim(),
        tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 8) : [],
        content: obj.contentHtml,
        author: byline,
        faqJsonLd,
        model,
    };
}

// Suggest blog article ideas grounded in the brand. Reusable for storefront sellers too —
// pass the seller's store as `brand`. `options.avoidTitles` prevents duplicating existing posts.
export async function generateArticleIdeas({ brand = {}, options = {} }) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; }
    catch { throw new Error("@anthropic-ai/sdk not installed"); }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const model = options.model || process.env.CONTENT_AI_MODEL || DEFAULT_MODEL;
    const count = Math.min(options.count || 10, 25);
    const audience = brand.audience || brand.description || "the business's customers";
    const facts = (brand.facts || []).map((f) => `- ${f}`).join("\n") || "- (none)";
    const avoid = (options.avoidTitles || []).slice(0, 120).map((t) => `- ${t}`).join("\n") || "- (none yet)";

    const system = `You are an SEO content strategist. You propose blog article ideas real customers would search for and that the business can credibly write about. Ideas must be educational and helpful — how-tos, guides, explainers, and comparisons of approaches or methods. NEVER propose ideas built around naming or comparing competitor companies/products, and NEVER ideas that would require fabricated statistics. Keep every idea tightly relevant to the business and its audience. Respond with ONLY a JSON array.`;

    const user = `Business: ${brand.name || "the business"}
What it does: ${brand.description || ""}
Audience: ${audience}

What the business can credibly speak to (keep ideas grounded in these):
${facts}

Do NOT duplicate or closely overlap these existing article titles:
${avoid}

Propose ${count} distinct, non-overlapping blog article ideas. Respond with ONLY a JSON array of objects, each:
{ "title": "working headline (<= 70 chars)", "topic": "a one-sentence brief to write the article from", "keyword": "primary search keyword", "rationale": "why it's worth writing (one short line)" }`;

    const res = await client.messages.create({
        model,
        max_tokens: options.maxTokens || 3500,
        system,
        messages: [{ role: "user", content: user }],
    });

    const text = (res?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const arr = extractJsonArray(text);
    if (!Array.isArray(arr)) throw new Error("AI did not return article ideas");
    return arr
        .filter((i) => i && i.title && i.topic)
        .slice(0, count)
        .map((i) => ({
            title: String(i.title).trim(),
            topic: String(i.topic).trim(),
            keyword: String(i.keyword || "").trim(),
            rationale: String(i.rationale || "").trim(),
        }));
}

function extractJsonArray(text) {
    if (!text) return null;
    let t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const start = t.indexOf("[");
    const end = t.lastIndexOf("]");
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

function extractJson(text) {
    if (!text) return null;
    let t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

function slugify(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}
