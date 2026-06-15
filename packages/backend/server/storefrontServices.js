// Shared storefront-management services. Each function is keyed on `orgId` and is framework-
// agnostic (no session/Request) so BOTH the platform and enterprise apps (premier) can mount the
// same storefront control panel — each app resolves orgId from its own auth and calls these.
// Server-only (Mongoose + env). Exported via "@pythias/backend/server".
import mongoose from "mongoose";
import crypto from "crypto";
import {
    StorefrontSite, StorefrontCampaign, StorefrontPage, StorefrontSession, StorefrontPathStat, StorefrontProductStat, StorefrontCollection,
    StorefrontDiscount, StorefrontGiftCard, StorefrontSegment, StorefrontFlow, StorefrontReturn, StorefrontTranslation, StorefrontSubscription,
    StorefrontExperiment, StorefrontExperimentStat, StorefrontReview, StorefrontReviewSummary, StorefrontAutopilotRun,
    StorefrontInventory, StorefrontRestockTask, StorefrontDemandCache,
    PlatformOrder, Organization, PlatformProduct,
} from "@pythias/mongo";
import { generateArticle, generateArticleIdeas } from "../functions/contentGenerator.js";
const randomCode = (prefix = "") => `${prefix}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Throw this for HTTP-mappable errors; route wrappers read err.status.
export function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

const LIVE_FIELDS = ["theme", "pages", "nav", "footer", "analytics", "businessInfo", "seo"];
const STOREFRONT_BASE = () => process.env.STOREFRONT_INTERNAL_BASE || "http://127.0.0.1:3020";
const INTERNAL_KEY = () => process.env.PYTHIAS_INTERNAL_KEY;
const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ── Storefront editor ────────────────────────────────────────────────────────
export async function getSiteForEdit(orgId) {
    let site = await StorefrontSite.findOne({ orgId }).lean();
    if (!site) {
        const org = await Organization.findById(orgId).select("name slug").lean();
        const created = await StorefrontSite.create({
            orgId, status: "draft", siteType: "commerce",
            subdomain: org?.slug, name: org?.name,
            pages: [{ slug: "home", title: "Home", sections: [] }],
        });
        site = created.toObject();
    }
    return site;
}
export async function saveSiteDraft(orgId, draft) {
    if (!draft || typeof draft !== "object") throw httpError(400, "draft is required");
    const clean = {};
    for (const k of LIVE_FIELDS) if (k in draft) clean[k] = draft[k];
    await StorefrontSite.updateOne({ orgId }, { $set: { draft: clean } }, { upsert: true });
}
export async function publishSite(orgId, draft) {
    const site = await StorefrontSite.findOne({ orgId });
    if (!site) throw httpError(404, "No storefront to publish");
    const source = (draft && typeof draft === "object") ? draft : (site.draft ?? {});
    for (const k of LIVE_FIELDS) if (k in source) site[k] = source[k];
    site.status = "published"; site.publishedAt = new Date(); site.draft = undefined;
    await site.save();
}

// ── Marketing: campaigns ─────────────────────────────────────────────────────
export async function listCampaigns(orgId) {
    return StorefrontCampaign.find({ orgId }).sort({ createdAt: -1 }).limit(100).lean();
}
export async function createCampaign(orgId, b, createdBy) {
    if (!b?.name || !b?.channel) throw httpError(400, "name and channel are required");
    return StorefrontCampaign.create({
        orgId, channel: b.channel, name: b.name, audience: b.audience || "all", segmentId: b.segmentId || undefined,
        subject: b.subject, html: b.html, body: b.body, status: "draft", createdBy,
    });
}
export async function updateCampaign(orgId, id, b) {
    const set = {};
    for (const k of ["name", "channel", "audience", "subject", "html", "body"]) if (k in b) set[k] = b[k];
    const camp = await StorefrontCampaign.findOneAndUpdate({ _id: id, orgId, status: "draft" }, { $set: set }, { new: true });
    if (!camp) throw httpError(404, "Not found or already sent");
    return camp;
}
export async function deleteCampaign(orgId, id) {
    await StorefrontCampaign.deleteOne({ _id: id, orgId, status: "draft" });
}
export async function sendCampaign(orgId, id) {
    const key = INTERNAL_KEY();
    if (!key) throw httpError(503, "Marketing sending not configured");
    const camp = await StorefrontCampaign.findOne({ _id: id, orgId }).select("_id status").lean();
    if (!camp) throw httpError(404, "Not found");
    if (["sending", "sent"].includes(camp.status)) throw httpError(409, "Already sent");
    const res = await fetch(`${STOREFRONT_BASE()}/api/internal/marketing/campaign-send`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-pythias-internal-key": key },
        body: JSON.stringify({ campaignId: String(id) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw httpError(res.status, data.error || "Send failed");
    return data;
}

// ── Marketing: signup popup ──────────────────────────────────────────────────
const POPUP_FIELDS = ["enabled", "headline", "body", "collectPhone", "requirePhone", "discountType",
    "discountValue", "codePrefix", "buttonText", "delaySeconds", "emailConsentText", "smsConsentText"];
export async function getPopup(orgId) {
    const site = await StorefrontSite.findOne({ orgId }).select("popup").lean();
    return site?.popup ?? {};
}
export async function savePopup(orgId, b) {
    const set = {};
    for (const k of POPUP_FIELDS) if (k in b) set[`popup.${k}`] = b[k];
    await StorefrontSite.updateOne({ orgId }, { $set: set });
}

// ── AI drafting (marketing email/SMS) ────────────────────────────────────────
async function anthropic() {
    if (!process.env.ANTHROPIC_API_KEY) throw httpError(503, "AI not configured (ANTHROPIC_API_KEY)");
    let Anthropic;
    try { Anthropic = (await import("@anthropic-ai/sdk")).default; } catch { throw httpError(503, "AI SDK not installed"); }
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
function parseJson(text) { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
const textOf = (msg) => (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();

export async function aiDraft({ channel = "email", prompt, brand = "our store", tone = "friendly" }) {
    if (!prompt) throw httpError(400, "prompt is required");
    const client = await anthropic();
    const instruction = channel === "sms"
        ? `Write a single marketing SMS for "${brand}" in a ${tone} tone, under 320 chars. Goal: ${prompt}. STRICT JSON: {"body":"..."} only.`
        : `Write a marketing email for "${brand}" in a ${tone} tone. Goal: ${prompt}. Return a short subject and an HTML body (inline-styled inner content, no <html>/<body>). STRICT JSON: {"subject":"...","html":"..."} only.`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 2000, thinking: { type: "adaptive" }, messages: [{ role: "user", content: instruction }] });
    return parseJson(textOf(msg));
}

// ── Analytics ────────────────────────────────────────────────────────────────
const RANGES = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
const dayKey = (d) => d.toISOString().slice(0, 10);
const avg = (sum, count) => (count > 0 ? Math.round(sum / count) : null);

export async function analyticsSummary(orgIdStr, range = "7d") {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const days = RANGES[range] || 7;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [sess] = await StorefrontSession.aggregate([
        { $match: { orgId, startedAt: { $gte: start } } },
        { $facet: {
            overview: [{ $group: { _id: null, sessions: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, pageviews: { $sum: "$pageviews" }, conversions: { $sum: { $cond: ["$converted", 1, 0] } }, revenueCents: { $sum: "$revenueCents" }, durationSum: { $sum: "$durationMs" }, bounces: { $sum: { $cond: [{ $lte: ["$pageviews", 1] }, 1, 0] } } } }],
            funnel: [{ $group: { _id: null, sessions: { $sum: 1 }, addedToCart: { $sum: { $cond: ["$addedToCart", 1, 0] } }, startedCheckout: { $sum: { $cond: ["$startedCheckout", 1, 0] } }, converted: { $sum: { $cond: ["$converted", 1, 0] } } } }],
            devices: [{ $group: { _id: "$device", count: { $sum: 1 } } }],
            referrers: [{ $group: { _id: { $ifNull: ["$referrerDomain", ""] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }],
            landing: [{ $match: { landingPath: { $ne: null } } }, { $group: { _id: "$landingPath", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }],
            exit: [{ $match: { exitPath: { $ne: null } } }, { $group: { _id: "$exitPath", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }],
            returning: [{ $group: { _id: { $cond: ["$returning", "returning", "new"] }, count: { $sum: 1 } } }],
            countries: [{ $match: { country: { $nin: [null, ""] } } }, { $group: { _id: "$country", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
            // Acquisition with revenue attribution (UTM source; "" = direct/referral).
            sources: [{ $group: { _id: { $ifNull: ["$utmSource", ""] }, sessions: { $sum: 1 }, conversions: { $sum: { $cond: ["$converted", 1, 0] } }, revenueCents: { $sum: "$revenueCents" } } }, { $sort: { sessions: -1 } }, { $limit: 8 }],
            campaigns: [{ $match: { utmCampaign: { $nin: [null, ""] } } }, { $group: { _id: "$utmCampaign", sessions: { $sum: 1 }, conversions: { $sum: { $cond: ["$converted", 1, 0] } }, revenueCents: { $sum: "$revenueCents" } } }, { $sort: { revenueCents: -1 } }, { $limit: 8 }],
        } },
    ]);
    const ov = sess.overview[0] || {}, fn = sess.funnel[0] || {}, sessions = ov.sessions || 0;

    // Product funnel: view → add-to-cart → purchase, per product (titles from the catalog).
    const prodAgg = await StorefrontProductStat.aggregate([
        { $match: { orgId, date: { $gte: dayKey(start) } } },
        { $group: { _id: "$productId", views: { $sum: "$views" }, addToCart: { $sum: "$addToCart" }, purchasedUnits: { $sum: "$purchasedUnits" } } },
        { $sort: { views: -1 } }, { $limit: 12 },
    ]);
    const prodDocs = prodAgg.length ? await PlatformProduct.find({ _id: { $in: prodAgg.map((p) => p._id) } }).select("title").lean() : [];
    const titleById = Object.fromEntries(prodDocs.map((p) => [String(p._id), p.title]));
    const products = prodAgg.map((p) => ({
        id: String(p._id), title: titleById[String(p._id)] || "(product)",
        views: p.views, addToCart: p.addToCart, purchasedUnits: p.purchasedUnits,
        cvr: p.views ? Math.round((p.purchasedUnits / p.views) * 1000) / 10 : 0,
    }));

    const pathAgg = await StorefrontPathStat.aggregate([
        { $match: { orgId, date: { $gte: dayKey(start) } } },
        { $group: { _id: "$path", views: { $sum: "$views" },
            lcpSum: { $sum: "$lcpSum" }, lcpCount: { $sum: "$lcpCount" }, clsSum: { $sum: "$clsSum" }, clsCount: { $sum: "$clsCount" },
            fcpSum: { $sum: "$fcpSum" }, fcpCount: { $sum: "$fcpCount" }, ttfbSum: { $sum: "$ttfbSum" }, ttfbCount: { $sum: "$ttfbCount" }, inpSum: { $sum: "$inpSum" }, inpCount: { $sum: "$inpCount" } } },
    ]);
    const topPages = [...pathAgg].sort((a, b) => b.views - a.views).slice(0, 10).map((p) => ({ path: p._id, views: p.views }));
    const v = pathAgg.reduce((a, p) => { for (const k of ["lcp", "cls", "fcp", "ttfb", "inp"]) { a[`${k}Sum`] += p[`${k}Sum`] || 0; a[`${k}Count`] += p[`${k}Count`] || 0; } return a; },
        { lcpSum: 0, lcpCount: 0, clsSum: 0, clsCount: 0, fcpSum: 0, fcpCount: 0, ttfbSum: 0, ttfbCount: 0, inpSum: 0, inpCount: 0 });
    const vitals = { lcp: avg(v.lcpSum, v.lcpCount), cls: v.clsCount ? Math.round((v.clsSum / v.clsCount) * 1000) / 1000 : null, fcp: avg(v.fcpSum, v.fcpCount), ttfb: avg(v.ttfbSum, v.ttfbCount), inp: avg(v.inpSum, v.inpCount) };
    const slowestPages = pathAgg.filter((p) => p.lcpCount >= 3).map((p) => ({ path: p._id, lcp: Math.round(p.lcpSum / p.lcpCount), samples: p.lcpCount })).sort((a, b) => b.lcp - a.lcp).slice(0, 8);
    const fmt = (arr) => arr.map((x) => ({ label: x._id === "" ? "Direct" : x._id, count: x.count }));

    return {
        range,
        overview: { visitors: (ov.visitors || []).length, sessions, pageviews: ov.pageviews || 0, conversions: ov.conversions || 0,
            conversionRate: sessions ? Math.round(((ov.conversions || 0) / sessions) * 1000) / 10 : 0, revenueCents: ov.revenueCents || 0,
            avgDurationSec: sessions ? Math.round((ov.durationSum || 0) / sessions / 1000) : 0, bounceRate: sessions ? Math.round(((ov.bounces || 0) / sessions) * 1000) / 10 : 0 },
        funnel: { sessions: fn.sessions || 0, addedToCart: fn.addedToCart || 0, startedCheckout: fn.startedCheckout || 0, converted: fn.converted || 0 },
        devices: fmt(sess.devices), referrers: fmt(sess.referrers), landingPages: fmt(sess.landing), exitPages: fmt(sess.exit),
        countries: fmt(sess.countries),
        newVsReturning: { new: sess.returning.find((x) => x._id === "new")?.count || 0, returning: sess.returning.find((x) => x._id === "returning")?.count || 0 },
        sources: (sess.sources || []).map((s) => ({ label: s._id === "" ? "Direct / referral" : s._id, sessions: s.sessions, conversions: s.conversions, revenueCents: s.revenueCents })),
        campaigns: (sess.campaigns || []).map((c) => ({ label: c._id, sessions: c.sessions, conversions: c.conversions, revenueCents: c.revenueCents })),
        products,
        topPages, totalViews: pathAgg.reduce((s, p) => s + p.views, 0), vitals, slowestPages,
    };
}

// AI insights: compare this period to the prior one and tell the seller what changed + what to do.
export async function analyticsInsights(orgId, range = "30d") {
    const client = await anthropic();
    const cur = await analyticsSummary(orgId, range);
    const prevDays = (RANGES[range] || 30) * 2;
    const wide = await analyticsSummary(orgId, prevDays >= 90 ? "90d" : "30d").catch(() => null);
    const data = {
        current: cur.overview,
        topProducts: cur.products.slice(0, 5),
        topSources: cur.sources.slice(0, 5),
        topExitPages: cur.exitPages.slice(0, 5),
        vitals: cur.vitals,
        newVsReturning: cur.newVsReturning,
        wider: wide?.overview,
    };
    const prompt = `You are an ecommerce analyst. Given this storefront's analytics JSON, give the owner 3-5 SHORT, specific, actionable insights (what changed/what's notable + what to do). STRICT JSON only: {"insights":[{"title":"...","detail":"one sentence","action":"one concrete next step"}]}.\n\n${JSON.stringify(data)}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 900, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    return parseJson(textOf(msg));
}

export async function analyticsLive(orgIdStr) {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const [agg] = await StorefrontSession.aggregate([
        { $match: { orgId, lastSeenAt: { $gte: since } } },
        { $facet: { total: [{ $count: "n" }], pages: [{ $group: { _id: "$exitPath", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }], devices: [{ $group: { _id: "$device", count: { $sum: 1 } } }] } },
    ]);
    return { active: agg.total[0]?.n || 0, pages: (agg.pages || []).map((p) => ({ path: p._id || "/", count: p.count })), devices: (agg.devices || []).map((d) => ({ label: d._id, count: d.count })) };
}

// ── SEO landing pages ────────────────────────────────────────────────────────
export async function listPages(orgId) {
    return StorefrontPage.find({ orgId }).sort({ updatedAt: -1 }).limit(500).lean();
}
export async function createPage(orgId, b, createdBy) {
    if (!b?.title) throw httpError(400, "title is required");
    const slug = slugify(b.slug || b.title);
    if (!slug) throw httpError(400, "invalid slug");
    try {
        return await StorefrontPage.create({ orgId, slug, title: b.title, seo: b.seo || {}, keywords: b.keywords || [], sections: b.sections || [],
            status: b.status === "published" ? "published" : "draft", publishedAt: b.status === "published" ? new Date() : undefined, createdBy });
    } catch (e) { if (e?.code === 11000) throw httpError(409, "A page with that slug already exists"); throw e; }
}
export async function updatePage(orgId, id, b) {
    const set = {};
    if (b.title != null) set.title = b.title;
    if (b.slug != null) set.slug = slugify(b.slug);
    if (b.seo != null) set.seo = b.seo;
    if (b.keywords != null) set.keywords = b.keywords;
    if (b.sections != null) set.sections = b.sections;
    if (b.status != null) { set.status = b.status === "published" ? "published" : "draft"; if (b.status === "published") set.publishedAt = new Date(); }
    try {
        const page = await StorefrontPage.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
        if (!page) throw httpError(404, "Not found");
        return page;
    } catch (e) { if (e?.code === 11000) throw httpError(409, "A page with that slug already exists"); throw e; }
}
export async function deletePage(orgId, id) {
    await StorefrontPage.deleteOne({ _id: id, orgId });
}
export async function aiPage({ keyword, brand = "our store" }) {
    if (!keyword) throw httpError(400, "keyword is required");
    const client = await anthropic();
    const prompt = `Create an SEO landing page targeting the keyword "${keyword}" for the store "${brand}". Write naturally (no keyword stuffing). STRICT JSON only: {"title":"H1","metaTitle":"<=60","metaDescription":"<=155","keywords":["3-6"],"heroHeadline":"...","heroSubheadline":"...","ctaText":"...","bodyHeading":"...","bodyText":"paragraphs separated by \\n\\n"}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 1600, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    const a = parseJson(textOf(msg));
    const sections = [
        { type: "hero", headline: a.heroHeadline || a.title, subheadline: a.heroSubheadline || "", ctaText: a.ctaText || "Shop now", ctaLink: "/products", align: "center" },
        { type: "richText", heading: a.bodyHeading || "", body: a.bodyText || "", align: "left" },
        { type: "featuredProducts", heading: "Shop the collection", limit: 8 },
    ];
    return { title: a.title || keyword, slug: slugify(keyword), seo: { title: a.metaTitle || a.title, description: a.metaDescription || "" }, keywords: Array.isArray(a.keywords) ? a.keywords.slice(0, 6) : [keyword], sections };
}

// ── AI blog/article generator (paid add-on, gated by site.aiEnabled) ──────────
// Reuses the shared, guardrailed generateArticle/generateArticleIdeas core but grounds
// it in the seller's own store (StorefrontSite + products). Saves results as StorefrontPage
// drafts. Shared by the platform and the enterprise apps (premier).
async function brandForOrg(orgId) {
    const site = await StorefrontSite.findOne({ orgId }).lean();
    if (!site) throw httpError(404, "No storefront found for this organization");
    if (!site.aiEnabled) throw httpError(402, "The AI content add-on is not enabled for this store");

    const org = await Organization.findById(orgId).select("name").lean();
    const products = await PlatformProduct.find({ orgId }).select("title slug").limit(40).lean();
    const host = site.customDomain?.hostname || (site.subdomain ? `${site.subdomain}.pythias.store` : null);
    const name = site.businessInfo?.legalName || org?.name || site.subdomain || "our store";

    const productTitles = products.map((p) => p.title).filter(Boolean).slice(0, 25);
    const facts = [`${name} is an online store${host ? ` at ${host}` : ""}.`];
    if (productTitles.length) facts.push(`${name} sells products including: ${productTitles.slice(0, 15).join(", ")}.`);
    if (site.shipping?.freeShipping) facts.push(`${name} offers free shipping.`);
    else if (site.shipping?.freeOverCents > 0) facts.push(`${name} offers free shipping on orders over $${(site.shipping.freeOverCents / 100).toFixed(2)}.`);
    if (site.rewards?.enabled) facts.push(`${name} has a customer rewards / loyalty program.`);
    if (site.businessInfo?.address?.city) facts.push(`${name} is based in ${[site.businessInfo.address.city, site.businessInfo.address.state].filter(Boolean).join(", ")}.`);

    const internalLinks = [
        { label: "Shop all products", href: "/products" },
        ...products.filter((p) => p.slug).slice(0, 8).map((p) => ({ label: p.title, href: `/products/${p.slug}` })),
    ];

    const brand = {
        name,
        description: site.seo?.description || site.businessInfo?.legalName || `${name} online store`,
        url: host ? `https://${host}` : "",
        audience: `${name}'s shoppers and customers`,
        voice: "friendly, helpful, and on-brand for an ecommerce store",
        byline: name,
        facts,
        internalLinks,
    };
    return { site, brand };
}

export async function storefrontArticleIdeas(orgId, { count } = {}) {
    const { brand } = await brandForOrg(orgId);
    const existing = await StorefrontPage.find({ orgId }).select("title").limit(200).lean();
    return generateArticleIdeas({ brand, options: { count: count || 10, avoidTitles: existing.map((p) => p.title).filter(Boolean) } });
}

export async function generateStorefrontArticle(orgId, b = {}, createdBy) {
    if (!b?.topic?.trim()) throw httpError(400, "topic is required");
    const { brand } = await brandForOrg(orgId);
    const article = await generateArticle({ topic: b.topic.trim(), brand });

    // RichText sections render plain text, so split the generated HTML into section blocks.
    const sections = htmlToStorefrontSections(article.content);

    let slug = article.slug || slugify(article.title);
    let final = slug, n = 1;
    while (await StorefrontPage.findOne({ orgId, slug: final }).select("_id").lean()) final = `${slug}-${++n}`;

    return StorefrontPage.create({
        orgId,
        slug: final,
        title: article.title,
        seo: { title: article.title, description: article.metaDescription },
        keywords: article.tags || [],
        sections,
        status: b.publish ? "published" : "draft",
        publishedAt: b.publish ? new Date() : undefined,
        createdBy,
    });
}

function htmlToText(html) {
    return String(html || "")
        .replace(/<li[^>]*>/gi, "• ")
        .replace(/<\/(p|h[1-6]|li|ul|ol|div|blockquote)>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
        .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"')
        .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function htmlToStorefrontSections(html) {
    const sections = [];
    const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    const heads = [];
    let m;
    while ((m = h2.exec(html))) heads.push({ heading: htmlToText(m[1]), start: m.index, contentStart: h2.lastIndex });

    if (heads.length === 0) {
        const body = htmlToText(html);
        if (body) sections.push({ type: "richText", heading: "", body, align: "left" });
    } else {
        const intro = htmlToText(html.slice(0, heads[0].start));
        if (intro) sections.push({ type: "richText", heading: "", body: intro, align: "left" });
        for (let i = 0; i < heads.length; i++) {
            const slice = html.slice(heads[i].contentStart, i + 1 < heads.length ? heads[i + 1].start : html.length);
            sections.push({ type: "richText", heading: heads[i].heading, body: htmlToText(slice), align: "left" });
        }
    }
    sections.push({ type: "featuredProducts", heading: "Shop our products", limit: 8 });
    return sections;
}

// ── Collections ──────────────────────────────────────────────────────────────
const COLLECTION_FIELDS = ["title", "slug", "description", "image", "seo", "type", "productIds", "rules", "sort", "status"];
function cleanCollection(b) {
    const set = {};
    for (const k of COLLECTION_FIELDS) if (k in b) set[k] = b[k];
    if ("slug" in set) set.slug = slugify(set.slug);
    if (set.status === "published") set.publishedAt = new Date();
    return set;
}
export async function listCollections(orgId) {
    return StorefrontCollection.find({ orgId }).sort({ updatedAt: -1 }).limit(500).lean();
}
export async function createCollection(orgId, b, createdBy) {
    if (!b?.title) throw httpError(400, "title is required");
    const set = cleanCollection(b);
    if (!set.slug) set.slug = slugify(b.title);
    if (!set.slug) throw httpError(400, "invalid slug");
    try { return await StorefrontCollection.create({ orgId, createdBy, ...set }); }
    catch (e) { if (e?.code === 11000) throw httpError(409, "A collection with that slug already exists"); throw e; }
}
export async function updateCollection(orgId, id, b) {
    try {
        const c = await StorefrontCollection.findOneAndUpdate({ _id: id, orgId }, { $set: cleanCollection(b) }, { new: true });
        if (!c) throw httpError(404, "Not found");
        return c;
    } catch (e) { if (e?.code === 11000) throw httpError(409, "A collection with that slug already exists"); throw e; }
}
export async function deleteCollection(orgId, id) {
    await StorefrontCollection.deleteOne({ _id: id, orgId });
}
export async function aiCollection({ prompt, brand = "our store" }) {
    if (!prompt) throw httpError(400, "prompt is required");
    const client = await anthropic();
    const instruction = `Turn this shopper description into a SMART collection for "${brand}": "${prompt}". Allowed condition fields: tag, category, brand, title, priceCents (cents). Allowed ops: contains, eq, lte, gte. STRICT JSON only:
{"title":"...","slug":"kebab","description":"1 sentence","seo":{"title":"<=60","description":"<=155"},"rules":{"match":"all|any","conditions":[{"field":"category","op":"contains","value":"hoodie"},{"field":"priceCents","op":"lte","value":4000}]}}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 900, thinking: { type: "adaptive" }, messages: [{ role: "user", content: instruction }] });
    const a = parseJson(textOf(msg));
    return { title: a.title || prompt, slug: slugify(a.slug || a.title || prompt), description: a.description || "", seo: a.seo || {}, type: "smart", rules: a.rules || { match: "all", conditions: [] } };
}

// ── Discounts ────────────────────────────────────────────────────────────────
const DISCOUNT_FIELDS = ["code", "type", "value", "automatic", "title", "active", "minSubtotalCents", "maxUses", "perCustomerLimit", "expiresAt"];
export async function listDiscounts(orgId) {
    return StorefrontDiscount.find({ orgId }).sort({ createdAt: -1 }).limit(500).lean();
}
export async function createDiscount(orgId, b) {
    const set = {};
    for (const k of DISCOUNT_FIELDS) if (k in b) set[k] = b[k];
    if (!set.type) throw httpError(400, "type is required");
    if (set.code) set.code = String(set.code).toUpperCase().trim();
    else if (!set.automatic) set.code = randomCode("SAVE");   // codes for non-automatic discounts
    try { return await StorefrontDiscount.create({ orgId, source: "manual", ...set }); }
    catch (e) { if (e?.code === 11000) throw httpError(409, "That code already exists"); throw e; }
}
export async function updateDiscount(orgId, id, b) {
    const set = {};
    for (const k of DISCOUNT_FIELDS) if (k in b) set[k] = (k === "code" && b[k]) ? String(b[k]).toUpperCase().trim() : b[k];
    const d = await StorefrontDiscount.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
    if (!d) throw httpError(404, "Not found");
    return d;
}
export async function deleteDiscount(orgId, id) {
    await StorefrontDiscount.deleteOne({ _id: id, orgId });
}
// AI promo suggestion from the store's recent performance (the "beat" angle).
export async function aiPromo(orgId, { goal = "increase conversions" } = {}) {
    const client = await anthropic();
    const a = await analyticsSummary(orgId, "30d").catch(() => null);
    const ctx = a ? `Conversion ${a.overview.conversionRate}%, bounce ${a.overview.bounceRate}%, ${a.overview.sessions} sessions, ${a.overview.conversions} orders in 30d.` : "No analytics yet.";
    const prompt = `A storefront wants to "${goal}". ${ctx} Suggest ONE promotion. STRICT JSON only:
{"type":"percent|fixed|free_shipping","value":number(percent or cents; 0 for free_shipping),"minSubtotalCents":number,"automatic":boolean,"title":"shopper-facing label","reason":"1 sentence why"}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    return parseJson(textOf(msg));
}

// ── Gift cards ───────────────────────────────────────────────────────────────
export async function listGiftCards(orgId) {
    return StorefrontGiftCard.find({ orgId }).sort({ createdAt: -1 }).limit(500).lean();
}
export async function issueGiftCard(orgId, b) {
    const initialCents = Math.round(Number(b?.initialCents) || 0);
    if (!(initialCents > 0)) throw httpError(400, "initialCents must be > 0");
    for (let i = 0; i < 5; i++) {
        const code = b?.code ? String(b.code).toUpperCase().trim() : randomCode("GIFT");
        try {
            return await StorefrontGiftCard.create({
                orgId, code, initialCents, balanceCents: initialCents,
                recipientEmail: b?.recipientEmail, purchaserEmail: b?.purchaserEmail, note: b?.note,
                expiresAt: b?.expiresAt,
            });
        } catch (e) { if (e?.code !== 11000 || b?.code) throw (e?.code === 11000 ? httpError(409, "That code already exists") : e); }
    }
    throw httpError(500, "Could not generate a unique code");
}
export async function updateGiftCard(orgId, id, b) {
    const set = {};
    if (b.active != null) set.active = !!b.active;
    if (b.balanceCents != null) set.balanceCents = Math.max(0, Math.round(Number(b.balanceCents) || 0));
    if (b.note != null) set.note = b.note;
    const gc = await StorefrontGiftCard.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
    if (!gc) throw httpError(404, "Not found");
    return gc;
}

// ── Segments ─────────────────────────────────────────────────────────────────
export async function listSegments(orgId) {
    return StorefrontSegment.find({ orgId }).sort({ createdAt: -1 }).limit(500).lean();
}
export async function createSegment(orgId, b) {
    if (!b?.name) throw httpError(400, "name is required");
    return StorefrontSegment.create({ orgId, name: b.name, description: b.description, rules: b.rules || { match: "all", conditions: [] } });
}
export async function updateSegment(orgId, id, b) {
    const set = {};
    for (const k of ["name", "description", "rules"]) if (k in b) set[k] = b[k];
    const s = await StorefrontSegment.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
    if (!s) throw httpError(404, "Not found");
    return s;
}
export async function deleteSegment(orgId, id) { await StorefrontSegment.deleteOne({ _id: id, orgId }); }
export async function aiSegment({ prompt }) {
    if (!prompt) throw httpError(400, "prompt is required");
    const client = await anthropic();
    const instruction = `Turn this audience description into segment rules: "${prompt}". Allowed fields: emailConsent,smsConsent,isLead,emailVerified,ordersCount,totalSpentCents(cents),lastOrderDaysAgo,signupDaysAgo,rewardsBalance(cents). Ops: is(boolean fields),gte,lte,eq. STRICT JSON only: {"name":"...","description":"...","rules":{"match":"all|any","conditions":[{"field":"ordersCount","op":"gte","value":1}]}}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 700, thinking: { type: "adaptive" }, messages: [{ role: "user", content: instruction }] });
    return parseJson(textOf(msg));
}

// ── Flows (automations) ──────────────────────────────────────────────────────
const FLOW_FIELDS = ["name", "trigger", "active", "segmentId", "steps"];
export async function listFlows(orgId) {
    return StorefrontFlow.find({ orgId }).sort({ createdAt: -1 }).limit(200).lean();
}
export async function createFlow(orgId, b) {
    if (!b?.name || !b?.trigger) throw httpError(400, "name and trigger are required");
    const set = {}; for (const k of FLOW_FIELDS) if (k in b) set[k] = b[k];
    return StorefrontFlow.create({ orgId, ...set });
}
export async function updateFlow(orgId, id, b) {
    const set = {}; for (const k of FLOW_FIELDS) if (k in b) set[k] = b[k];
    const f = await StorefrontFlow.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
    if (!f) throw httpError(404, "Not found");
    return f;
}
export async function deleteFlow(orgId, id) { await StorefrontFlow.deleteOne({ _id: id, orgId }); }
export async function aiFlow({ prompt, brand = "our store" }) {
    if (!prompt) throw httpError(400, "prompt is required");
    const client = await anthropic();
    const instruction = `Design a marketing automation for "${brand}": "${prompt}". Triggers: signup,first_purchase,any_purchase,abandoned_cart,win_back. Each step has delayHours (from enrollment), channel "email", subject, and html (inline-styled inner content). STRICT JSON only: {"name":"...","trigger":"signup","steps":[{"delayHours":0,"channel":"email","subject":"...","html":"..."}]}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 2500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: instruction }] });
    return parseJson(textOf(msg));
}

// ── Payouts (Stripe Connect via storefront internal endpoints) ───────────────
async function callStorefront(path, body) {
    const key = INTERNAL_KEY();
    if (!key) throw httpError(503, "Payouts not configured (missing PYTHIAS_INTERNAL_KEY)");
    const res = await fetch(`${STOREFRONT_BASE()}${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-pythias-internal-key": key }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw httpError(res.status || 502, data.error || "Storefront call failed");
    return data;
}
export async function payoutStatus(orgId) { return callStorefront("/api/internal/payouts/status", { orgId: String(orgId) }); }
export async function payoutOnboard(orgId, returnUrl) {
    if (!returnUrl) throw httpError(400, "returnUrl is required");
    return callStorefront("/api/internal/payouts/onboard", { orgId: String(orgId), returnUrl });
}

// ── Internationalization ──────────────────────────────────────────────────────
// Canonical UI strings to translate (must mirror the storefront's lib/i18nStrings.js BASE_STRINGS).
const BASE_UI_STRINGS = {
    "nav.search": "Search…", "nav.signin": "Sign in",
    "cart.title": "Cart", "cart.empty": "Your cart is empty", "cart.continueShopping": "Continue shopping",
    "cart.subtotal": "Subtotal", "cart.checkout": "Checkout", "cart.saveForLater": "Save for later",
    "cart.remove": "Remove", "cart.savedForLater": "Saved for later", "cart.moveToCart": "Move to cart",
    "cart.freeShipProgress": "Add {amount} more for free shipping", "cart.freeShipUnlocked": "You've unlocked free shipping!",
    "product.addToCart": "Add to cart", "product.added": "Added", "product.viewCart": "View cart",
    "product.reviews": "Reviews", "product.writeReview": "Write a review",
    "checkout.title": "Checkout", "checkout.continue": "Continue to payment", "checkout.pay": "Pay now",
    "checkout.shipping": "Shipping", "checkout.tax": "Tax", "checkout.total": "Total", "checkout.promo": "Promo code", "checkout.apply": "Apply",
    "search.placeholder": "Search products…", "search.results": "Results", "collections.title": "Collections",
    "account.favorites": "Favorites", "account.orders": "Orders", "account.signOut": "Sign out",
};
const I18N_FIELDS = ["defaultCurrency", "currencies", "defaultLang", "languages"];
export async function getI18nConfig(orgId) {
    const site = await StorefrontSite.findOne({ orgId }).select("i18n").lean();
    return site?.i18n || {};
}
export async function saveI18nConfig(orgId, b) {
    const set = {};
    for (const k of I18N_FIELDS) if (k in b) set[`i18n.${k}`] = b[k];
    await StorefrontSite.updateOne({ orgId }, { $set: set });
}
// AI-translate the UI string set into a language and store each (the "beat" — built-in, no app).
export async function aiTranslate(orgId, lang) {
    if (!lang || lang === "en") throw httpError(400, "Pick a non-English language");
    const client = await anthropic();
    const msg = await client.messages.create({
        model: "claude-opus-4-8", max_tokens: 2000, thinking: { type: "adaptive" },
        messages: [{ role: "user", content: `Translate these e-commerce UI strings to language code "${lang}". Keep placeholders like {amount} intact. Return STRICT JSON: the same keys with translated values, nothing else.\n\n${JSON.stringify(BASE_UI_STRINGS)}` }],
    });
    const out = parseJson(textOf(msg));
    let n = 0;
    for (const [key, value] of Object.entries(out)) {
        if (typeof value !== "string") continue;
        await StorefrontTranslation.updateOne({ orgId, lang, key }, { $set: { value } }, { upsert: true });
        n++;
    }
    // Ensure the language is listed on the site.
    await StorefrontSite.updateOne({ orgId }, { $addToSet: { "i18n.languages": lang } });
    return { translated: n, lang };
}

// ── True profit analytics (landed-cost P&L) ────────────────────────────────────
// Real net profit per storefront order from stored fields: revenue − COGS(wholesale) −
// payment fees(Stripe + 1%) − refunds. Shopify shows revenue; this shows margin. The BEAT.
export async function profitAnalytics(orgIdStr, range = "30d") {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const days = RANGES[range] || 30;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [agg] = await PlatformOrder.aggregate([
        { $match: { orgId, source: "storefront", date: { $gte: start } } },
        { $project: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            subtotal:  { $ifNull: ["$storefrontPayout.subtotalCents", 0] },
            wholesale: { $ifNull: ["$storefrontPayout.wholesaleCents", 0] },
            stripeFee: { $ifNull: ["$storefrontPayout.stripeFeeCents", 0] },
            discount:  { $add: [{ $multiply: [{ $ifNull: ["$discountAmount", 0] }, 100] }, { $ifNull: ["$rewardsRedeemedCents", 0] }, { $ifNull: ["$giftCardRedeemedCents", 0] }] },
        } },
        { $project: {
            day: 1, subtotal: 1, wholesale: 1, discount: 1,
            netSales: { $subtract: ["$subtotal", "$discount"] },
            fees: { $add: ["$stripeFee", { $round: [{ $multiply: ["$subtotal", 0.01] }, 0] }] },
        } },
        { $project: { day: 1, netSales: 1, wholesale: 1, fees: 1, discount: 1, profit: { $subtract: ["$netSales", { $add: ["$wholesale", "$fees"] }] } } },
        { $facet: {
            totals: [{ $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$netSales" }, cogs: { $sum: "$wholesale" }, fees: { $sum: "$fees" }, discounts: { $sum: "$discount" }, profit: { $sum: "$profit" } } }],
            trend:  [{ $group: { _id: "$day", profit: { $sum: "$profit" }, revenue: { $sum: "$netSales" } } }, { $sort: { _id: 1 } }],
        } },
    ]);
    const t = agg.totals[0] || {};
    const refundAgg = await StorefrontReturn.aggregate([{ $match: { orgId, status: "refunded", updatedAt: { $gte: start } } }, { $group: { _id: null, refunds: { $sum: "$refundCents" } } }]);
    const refunds = refundAgg[0]?.refunds || 0;
    const revenue = t.revenue || 0, orders = t.orders || 0;
    const profit = (t.profit || 0) - refunds;
    return {
        range,
        totals: {
            orders, revenueCents: revenue, cogsCents: t.cogs || 0, feesCents: t.fees || 0, discountsCents: t.discounts || 0, refundsCents: refunds, profitCents: profit,
            marginPct: revenue ? Math.round((profit / revenue) * 1000) / 10 : 0,
            aovCents: orders ? Math.round(revenue / orders) : 0,
            profitPerOrderCents: orders ? Math.round(profit / orders) : 0,
        },
        trend: (agg.trend || []).map((d) => ({ date: d._id, profitCents: d.profit, revenueCents: d.revenue })),
    };
}

// ── AI Store Autopilot (closed-loop optimization) ─────────────────────────────
// Reads the store's signals → proposes prioritized actions it can ACTUALLY apply (by calling
// the services below). Beyond suggestion tools: acts across analytics + marketing + i18n. The BEAT.
export async function autopilotRecommendations(orgId) {
    const client = await anthropic();
    const [a, p, i18n] = await Promise.all([
        analyticsSummary(orgId, "30d").catch(() => null),
        profitAnalytics(orgId, "30d").catch(() => null),
        getI18nConfig(orgId).catch(() => ({})),
    ]);
    const signals = [];
    if (a) {
        signals.push(`Visitors ${a.overview.visitors}, conversion ${a.overview.conversionRate}%, bounce ${a.overview.bounceRate}%, AOV $${((p?.totals?.aovCents || 0) / 100).toFixed(2)}.`);
        signals.push(`Funnel: ${a.funnel.sessions} visited → ${a.funnel.addedToCart} cart → ${a.funnel.startedCheckout} checkout → ${a.funnel.converted} bought.`);
        if (a.exitPages?.length) signals.push(`Top exit pages: ${a.exitPages.slice(0, 3).map((e) => e.label).join(", ")}.`);
        if (a.referrers?.length) signals.push(`Top sources: ${a.referrers.slice(0, 3).map((r) => `${r.label}(${r.count})`).join(", ")}.`);
        if (a.vitals?.lcp) signals.push(`Page speed LCP ${a.vitals.lcp}ms${a.slowestPages?.length ? `; slowest: ${a.slowestPages[0].path} ${a.slowestPages[0].lcp}ms` : ""}.`);
    }
    if (p) signals.push(`Net profit (30d) $${(p.totals.profitCents / 100).toFixed(2)} at ${p.totals.marginPct}% margin on ${p.totals.orders} orders.`);
    signals.push(`Languages enabled: en${(i18n.languages || []).length ? ", " + i18n.languages.join(", ") : " only"}.`);
    if (!a || a.overview.sessions === 0) return { recommendations: [], note: "Not enough traffic yet — autopilot needs visitors to learn from." };

    const schema = `Allowed action types (use EXACTLY these):
- {"type":"automatic_discount","params":{"discountType":"percent|fixed|free_shipping","value":<percent or cents; 0 for free_shipping>,"title":"shopper label","minSubtotalCents":<0 ok>}}
- {"type":"create_flow","params":{"trigger":"signup|abandoned_cart|win_back|first_purchase","prompt":"what the email series should say"}}
- {"type":"create_campaign","params":{"channel":"email","audience":"all|customers|leads","prompt":"what the campaign announces"}}
- {"type":"translate","params":{"lang":"es|fr|de|it|pt|ja"}}
- {"type":"popup_experiment","params":{"prompt":"describe an alternative signup-popup variant to A/B test"}}`;
    const prompt = `You are the autopilot for an online store. Based on these signals, propose 3-5 high-impact actions to grow profit/conversions. Prefer the biggest lever first. ${schema}\n\nSIGNALS:\n${signals.join("\n")}\n\nSTRICT JSON only: {"recommendations":[{"title":"short","why":"1 sentence tied to a signal","impact":"high|medium|low","action":{...one allowed action...}}]}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 1500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    const out = parseJson(textOf(msg));
    return { recommendations: (out.recommendations || []).slice(0, 6), signals };
}

// Execute one approved autopilot action by calling the relevant service.
export async function applyAutopilotAction(orgId, action, createdBy) {
    const t = action?.type, params = action?.params || {};
    if (t === "automatic_discount") {
        const d = await createDiscount(orgId, { automatic: true, type: params.discountType || "percent", value: Number(params.value) || 0, title: params.title || "Special offer", minSubtotalCents: Number(params.minSubtotalCents) || 0, active: true });
        return { ok: true, message: `Automatic discount "${d.title}" is live.` };
    }
    if (t === "create_flow") {
        const flow = await aiFlow({ prompt: params.prompt || "engagement series" });
        const created = await createFlow(orgId, { name: flow.name || "Automation", trigger: params.trigger || flow.trigger || "signup", active: true, steps: flow.steps || [] });
        return { ok: true, message: `Automation "${created.name}" created and activated.` };
    }
    if (t === "create_campaign") {
        const draft = await aiDraft({ channel: params.channel || "email", prompt: params.prompt || "news" });
        const camp = await createCampaign(orgId, { name: (params.prompt || "Campaign").slice(0, 60), channel: params.channel || "email", audience: params.audience || "all", subject: draft.subject, html: draft.html, body: draft.body }, createdBy);
        return { ok: true, message: `Draft campaign "${camp.name}" created — review & send in Marketing.` };
    }
    if (t === "translate") {
        const r = await aiTranslate(orgId, params.lang);
        return { ok: true, message: `Translated the store UI to ${String(params.lang).toUpperCase()} (${r.translated} strings).` };
    }
    if (t === "popup_experiment") {
        const v = await aiVariant({ type: "popup", goal: params.prompt || "more signups" });
        await createExperiment(orgId, { name: "Autopilot popup test", type: "popup", variants: [{ key: "A", label: "Control", weightPct: 50, config: {} }, { key: "B", label: "Variant", weightPct: 50, config: v }] });
        return { ok: true, message: "Started a popup A/B test — see A/B Testing for results." };
    }
    throw httpError(400, "Unknown action");
}

// ── Scheduled / autonomous autopilot ───────────────────────────────────────────
// Zero-risk action types safe to apply WITHOUT a human in the loop: they spend no money
// and send nothing. Discounts/flows/campaigns always wait for the seller's one-click review.
const SAFE_AUTO = new Set(["translate", "popup_experiment"]);

// Run one store: generate recommendations, optionally auto-apply the zero-risk ones,
// and persist the run (the seller's dashboard reads the latest). `apply` is gated by the
// seller's autoApply config; a manual run passes apply=false (the seller is present).
export async function runAutopilotForOrg(orgId, { apply = false, trigger = "manual", createdBy = "autopilot" } = {}) {
    const { recommendations = [], note } = await autopilotRecommendations(orgId);
    const applied = [], pending = [];
    for (const r of recommendations) {
        const type = r.action?.type;
        if (apply && SAFE_AUTO.has(type)) {
            try { const res = await applyAutopilotAction(orgId, r.action, createdBy); applied.push({ title: r.title, type, message: res.message }); }
            catch { pending.push(r); }   // couldn't auto-apply → leave it for review
        } else {
            pending.push(r);
        }
    }
    const run = await StorefrontAutopilotRun.create({ orgId, trigger, recommendations, applied, pending, note: note || "" });
    await StorefrontSite.updateOne({ orgId }, { $set: { "autopilot.lastRunAt": new Date() } });
    return run.toObject();
}

// Cron entry point: run autopilot for every published store that turned on autonomous mode.
export async function runAutonomousAutopilot() {
    const sites = await StorefrontSite.find({ "autopilot.autonomous": true, status: "published" }).select("orgId autopilot").limit(2000).lean();
    let orgsRun = 0, applied = 0, pending = 0;
    for (const site of sites) {
        try {
            const run = await runAutopilotForOrg(site.orgId, { apply: !!site.autopilot?.autoApply, trigger: "scheduled", createdBy: "autopilot" });
            orgsRun++; applied += run.applied.length; pending += run.pending.length;
        } catch { /* skip this org, continue the sweep */ }
    }
    return { orgsRun, applied, pending, sites: sites.length };
}

export async function getAutopilotState(orgId) {
    const [site, lastRun] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("autopilot").lean(),
        StorefrontAutopilotRun.findOne({ orgId }).sort({ createdAt: -1 }).lean(),
    ]);
    return { config: site?.autopilot || { autonomous: false, autoApply: false }, lastRun: lastRun || null };
}

export async function saveAutopilotConfig(orgId, { autonomous, autoApply } = {}) {
    const set = {};
    if (autonomous !== undefined) set["autopilot.autonomous"] = !!autonomous;
    if (autoApply !== undefined) set["autopilot.autoApply"] = !!autoApply;
    if (Object.keys(set).length) await StorefrontSite.updateOne({ orgId }, { $set: set });
    return getAutopilotState(orgId);
}

// ── Reviews moderation (seller) ────────────────────────────────────────────────
export async function listSellerReviews(orgId, status) {
    const q = { orgId };
    if (status) q.status = status;
    return StorefrontReview.find(q).sort({ createdAt: -1 }).limit(500).lean();
}
// Recompute the cached rating rollup from published reviews (counts only; AI summary is
// regenerated storefront-side on new reviews).
async function recomputeReviewSummary(orgId, productId) {
    const [a] = await StorefrontReview.aggregate([
        { $match: { orgId: new mongoose.Types.ObjectId(orgId), productId: new mongoose.Types.ObjectId(productId), status: "published" } },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$rating" },
            d1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }, d2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            d3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } }, d4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } }, d5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } } } },
    ]);
    const count = a?.count || 0;
    await StorefrontReviewSummary.updateOne({ orgId, productId }, { $set: {
        avg: count ? Math.round((a.sum / count) * 10) / 10 : 0, count,
        distribution: { 1: a?.d1 || 0, 2: a?.d2 || 0, 3: a?.d3 || 0, 4: a?.d4 || 0, 5: a?.d5 || 0 },
    } }, { upsert: true });
}
export async function replyToReview(orgId, id, body) {
    const r = await StorefrontReview.findOneAndUpdate({ _id: id, orgId }, { $set: { sellerReply: { body: String(body || "").slice(0, 2000), at: new Date() } } }, { new: true });
    if (!r) throw httpError(404, "Not found");
    return r;
}
export async function moderateReview(orgId, id, status) {
    if (!["published", "rejected", "pending"].includes(status)) throw httpError(400, "bad status");
    const r = await StorefrontReview.findOneAndUpdate({ _id: id, orgId }, { $set: { status } }, { new: true });
    if (!r) throw httpError(404, "Not found");
    await recomputeReviewSummary(orgId, r.productId).catch(() => {});
    return r;
}

// ── A/B testing ────────────────────────────────────────────────────────────────
export async function listExperiments(orgId) {
    const exps = await StorefrontExperiment.find({ orgId }).sort({ createdAt: -1 }).limit(200).lean();
    const stats = await StorefrontExperimentStat.find({ orgId }).lean();
    const byExp = {};
    for (const s of stats) (byExp[String(s.experimentId)] ||= {})[s.variant] = s;
    return exps.map((e) => ({
        ...e,
        results: (e.variants || []).map((v) => {
            const st = byExp[String(e._id)]?.[v.key] || {};
            const exposures = st.exposures || 0, conversions = st.conversions || 0;
            return { key: v.key, label: v.label, exposures, conversions, convRate: exposures ? Math.round((conversions / exposures) * 1000) / 10 : 0 };
        }),
    }));
}
export async function createExperiment(orgId, b) {
    if (!b?.name || !b?.variants?.length) throw httpError(400, "name and variants are required");
    return StorefrontExperiment.create({ orgId, name: b.name, type: b.type || "popup", status: "running", variants: b.variants });
}
export async function updateExperiment(orgId, id, b) {
    const set = {};
    for (const k of ["name", "type", "status", "variants", "winner"]) if (k in b) set[k] = b[k];
    const e = await StorefrontExperiment.findOneAndUpdate({ _id: id, orgId }, { $set: set }, { new: true });
    if (!e) throw httpError(404, "Not found");
    return e;
}
export async function deleteExperiment(orgId, id) {
    await StorefrontExperiment.deleteOne({ _id: id, orgId });
    await StorefrontExperimentStat.deleteMany({ orgId, experimentId: id });
}
// Promote a variant to the winner: stop the test and, for popup tests, apply the winning copy live.
export async function promoteExperimentWinner(orgId, id, variantKey) {
    const exp = await StorefrontExperiment.findOne({ _id: id, orgId });
    if (!exp) throw httpError(404, "Not found");
    const win = exp.variants.find((v) => v.key === variantKey);
    if (!win) throw httpError(400, "Unknown variant");
    exp.winner = variantKey; exp.status = "stopped"; await exp.save();
    if (exp.type === "popup" && win.config) {
        const set = {};
        for (const k of ["headline", "body", "buttonText"]) if (win.config[k] != null) set[`popup.${k}`] = win.config[k];
        if (Object.keys(set).length) await StorefrontSite.updateOne({ orgId }, { $set: set });
    }
    return { winner: variantKey, applied: exp.type === "popup" };
}
export async function aiVariant({ type = "popup", goal = "more signups" }) {
    const client = await anthropic();
    const fields = type === "popup" ? `{"headline":"...","body":"...","buttonText":"..."}` : `{"headline":"...","subheadline":"..."}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: `Write a punchy alternative ${type} variant to A/B test for "${goal}". STRICT JSON only: ${fields}` }] });
    return parseJson(textOf(msg));
}

// ── Subscriptions (subscribe & save) ──────────────────────────────────────────
const SUB_FIELDS = ["enabled", "discountPercent", "intervals"];
export async function getSubscriptionsData(orgId) {
    const site = await StorefrontSite.findOne({ orgId }).select("subscriptions").lean();
    const subscriptions = await StorefrontSubscription.find({ orgId }).sort({ createdAt: -1 }).limit(500)
        .select("status intervalLabel intervalDays discountPercent nextBillingAt cyclesBilled customerEmail items").lean();
    return { config: site?.subscriptions || { enabled: false }, subscriptions };
}
export async function saveSubsConfig(orgId, b) {
    const set = {};
    for (const k of SUB_FIELDS) if (k in b) set[`subscriptions.${k}`] = b[k];
    await StorefrontSite.updateOne({ orgId }, { $set: set });
}
// AI churn prediction: summarize subscription health + retention actions (the "beat").
export async function subscriptionChurnInsights(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const rows = await StorefrontSubscription.aggregate([
        { $match: { orgId: oid } },
        { $group: { _id: "$status", count: { $sum: 1 }, withFailed: { $sum: { $cond: [{ $gt: ["$failedAttempts", 0] }, 1, 0] } }, avgCycles: { $avg: "$cyclesBilled" } } },
    ]);
    const total = rows.reduce((s, r) => s + r.count, 0);
    if (!total) return { atRisk: 0, insights: [] };
    const by = Object.fromEntries(rows.map((r) => [r._id, r]));
    const atRisk = (by.paused?.count || 0) + (by.active?.withFailed || 0);
    const client = await anthropic();
    const ctx = `Subscriptions: ${by.active?.count || 0} active (${by.active?.withFailed || 0} with a failed charge), ${by.paused?.count || 0} paused, ${by.canceled?.count || 0} canceled. Avg deliveries before issues ~${Math.round(by.active?.avgCycles || 0)}.`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 700, thinking: { type: "adaptive" }, messages: [{ role: "user", content: `${ctx}\nGive 3-4 SHORT, concrete retention actions to reduce subscription churn. STRICT JSON only: {"insights":[{"title":"...","detail":"...","action":"..."}]}` }] });
    return { atRisk, ...parseJson(textOf(msg)) };
}

// ── Returns / RMA ────────────────────────────────────────────────────────────
export async function listReturns(orgId, status) {
    const q = { orgId };
    if (status) q.status = status;
    return StorefrontReturn.find(q).sort({ createdAt: -1 }).limit(500).lean();
}
// Seller action — money/fulfillment runs in the storefront (marketplace Stripe + rewards + routing).
export async function processReturn(orgId, returnId, body = {}) {
    const ret = await StorefrontReturn.findOne({ _id: returnId, orgId }).select("_id").lean();
    if (!ret) throw httpError(404, "Return not found");
    return callStorefront("/api/internal/returns/process", { returnId: String(returnId), action: body.action, amountCents: body.amountCents, sellerNote: body.sellerNote });
}
// AI: why are products being returned + what to do (the "beat" — feeds product improvements).
export async function returnsInsights(orgId) {
    const agg = await StorefrontReturn.aggregate([
        { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
        { $unwind: "$items" },
        { $group: { _id: { reason: "$items.reason", style: "$items.styleCode" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 60 },
    ]);
    if (!agg.length) return { insights: [] };
    const client = await anthropic();
    const rows = agg.map((a) => `${a._id.style || "?"}: ${a._id.reason} ×${a.count}`).join("\n");
    const prompt = `These are a store's product return reasons (style: reason × count). Give 3-5 SHORT insights on WHY items are returned + a concrete fix (sizing chart, photos, QA, description). STRICT JSON only: {"insights":[{"title":"...","detail":"...","action":"..."}]}\n\n${rows}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 800, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    return parseJson(textOf(msg));
}
