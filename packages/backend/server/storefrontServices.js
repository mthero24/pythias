// Shared storefront-management services. Each function is keyed on `orgId` and is framework-
// agnostic (no session/Request) so BOTH the platform and enterprise apps (premier) can mount the
// same storefront control panel — each app resolves orgId from its own auth and calls these.
// Server-only (Mongoose + env). Exported via "@pythias/backend/server".
import mongoose from "mongoose";
import crypto from "crypto";
import zlib from "zlib";
import {
    StorefrontSite, StorefrontCampaign, StorefrontPage, StorefrontSession, StorefrontPathStat, StorefrontProductStat, StorefrontCollection,
    StorefrontDiscount, StorefrontGiftCard, StorefrontSegment, StorefrontFlow, StorefrontReturn, StorefrontTranslation, StorefrontSubscription,
    StorefrontExperiment, StorefrontExperimentStat, StorefrontReview, StorefrontReviewSummary, StorefrontAutopilotRun,
    StorefrontInventory, StorefrontRestockTask, StorefrontDemandCache,
    PlatformOrder, PlatformItem, Organization, PlatformProduct,
    Inventory, Blank, InventoryOrders,
    NetworkFraudEntry, NetworkSuppression, reportNetworkFraud, StorefrontDispute,
    ProviderCapacity, ProviderLocation, ProviderCatalog, ProviderScore, RoutingLog,
    StorefrontChannelConnection, StorefrontChannelListing, StorefrontAdSpend,
} from "@pythias/mongo";
import { generateArticle, generateArticleIdeas } from "../functions/contentGenerator.js";
import { generateSceneImage, generateImage, generateImageDataUrl, sceneGenAvailable } from "../functions/sceneImage.js";
const randomCode = (prefix = "") => `${prefix}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Throw this for HTTP-mappable errors; route wrappers read err.status.
export function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

// Fields the editor's draft → publish flow manages. NOTE: `redirects` and `termContent` are intentionally
// excluded — they're written straight to the live site by their services (migrator / term generator) and
// must not be round-tripped through the draft (a stale autosave would clobber them).
const LIVE_FIELDS = ["name", "theme", "pages", "nav", "footer", "policies", "system", "productUrlMode", "catalog", "indexableTerms", "analytics", "businessInfo", "seo", "reviews", "cartAddOns", "shipping", "announcement"];
const STOREFRONT_BASE = () => process.env.STOREFRONT_INTERNAL_BASE || "http://127.0.0.1:3020";
const INTERNAL_KEY = () => process.env.PYTHIAS_INTERNAL_KEY;
const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ── Storefront editor ────────────────────────────────────────────────────────
// Resolve which StorefrontSite a request targets: an explicit siteId (scoped to the org), else the
// org's primary/entitled site. Supports the multi-store admin (one org, several storefronts).
function _siteFilter(orgId, siteId) {
    return siteId ? { _id: siteId, orgId } : { orgId };
}
export async function getSiteForEdit(orgId, siteId) {
    let site = siteId
        ? await StorefrontSite.findOne({ _id: siteId, orgId }).lean()
        : (await StorefrontSite.findOne({ orgId, primary: true }).lean()) || (await StorefrontSite.findOne({ orgId }).lean());
    if (!site && !siteId) {
        const org = await Organization.findById(orgId).select("name slug").lean();
        const created = await StorefrontSite.create({
            orgId, status: "draft", siteType: "commerce", primary: true,
            subdomain: org?.slug, name: org?.name,
            pages: [{ slug: "home", title: "Home", sections: [] }],
        });
        site = created.toObject();
    }
    if (!site) throw httpError(404, "Store not found");
    return site;
}
export async function saveSiteDraft(orgId, draft, siteId) {
    if (!draft || typeof draft !== "object") throw httpError(400, "draft is required");
    const clean = {};
    for (const k of LIVE_FIELDS) if (k in draft) clean[k] = draft[k];
    await StorefrontSite.updateOne(_siteFilter(orgId, siteId), { $set: { draft: clean } }, { upsert: !siteId });
}
export async function publishSite(orgId, draft, siteId) {
    const site = await StorefrontSite.findOne(siteId ? { _id: siteId, orgId } : { orgId, primary: true }) || await StorefrontSite.findOne({ orgId });
    if (!site) throw httpError(404, "No storefront to publish");
    const source = (draft && typeof draft === "object") ? draft : (site.draft ?? {});
    for (const k of LIVE_FIELDS) if (k in source) site[k] = source[k];
    site.status = "published"; site.publishedAt = new Date(); site.draft = undefined;
    await site.save();
}

// ── Multi-store (an org can run several storefronts; extras billed per plan) ──
const STORE_PLAN_LIMITS = {
    starter:    { includedStores: 1, extraStoreCents: 2500 },
    pro:        { includedStores: 3, extraStoreCents: 7500 },
    enterprise: { includedStores: 5, extraStoreCents: 20000 },
};
export async function listStores(orgId) {
    const sites = await StorefrontSite.find({ orgId }).select("name subdomain customDomain primary status plan publishedAt createdAt").sort({ primary: -1, createdAt: 1 }).lean();
    const entitled = sites.find((s) => s.plan && s.plan !== "none");
    const plan = entitled?.plan || null;
    const lim = plan ? STORE_PLAN_LIMITS[plan] : null;
    const count = sites.length;
    return {
        plan, includedStores: lim?.includedStores || 0, extraStoreCents: lim?.extraStoreCents || 0,
        count, extraBilled: lim ? Math.max(0, count - lim.includedStores) : 0,
        stores: sites.map((s) => ({ id: String(s._id), name: s.name || "Store", subdomain: s.subdomain || null, customDomain: s.customDomain?.hostname || null, primary: !!s.primary, status: s.status, publishedAt: s.publishedAt || null })),
    };
}
// DB side of adding a store; returns the info the route needs to apply Stripe billing.
export async function addStore(orgId, { name, subdomain } = {}) {
    const primary = await StorefrontSite.findOne({ orgId, plan: { $ne: "none" } });
    if (!primary) throw httpError(400, "Subscribe to a storefront plan before adding stores.");
    const lim = STORE_PLAN_LIMITS[primary.plan];
    if (!lim) throw httpError(400, "Unknown plan");
    const sub = String(subdomain || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (!sub) throw httpError(400, "A subdomain is required.");
    if (await StorefrontSite.findOne({ subdomain: sub }).select("_id").lean()) throw httpError(409, "That subdomain is already taken.");
    const site = await StorefrontSite.create({ orgId, name: String(name || "New store").slice(0, 80), subdomain: sub, primary: false, plan: "none", status: "draft", pages: [{ slug: "home", title: "Home", sections: [] }] });
    const count = await StorefrontSite.countDocuments({ orgId });
    const extras = Math.max(0, count - lim.includedStores);
    return { siteId: String(site._id), count, extras, extraStoreCents: lim.extraStoreCents, plan: primary.plan, subscriptionId: primary.subscription?.stripeSubscriptionId || null, extraStoreItemId: primary.subscription?.extraStoreItemId || null };
}
export async function removeStore(orgId, siteId) {
    const site = await StorefrontSite.findOne({ _id: siteId, orgId });
    if (!site) throw httpError(404, "Store not found");
    if (site.primary) throw httpError(400, "Can't remove your primary store.");
    await StorefrontSite.deleteOne({ _id: siteId });
    const primary = await StorefrontSite.findOne({ orgId, plan: { $ne: "none" } });
    const lim = primary ? STORE_PLAN_LIMITS[primary.plan] : null;
    const count = await StorefrontSite.countDocuments({ orgId });
    return { count, extras: lim ? Math.max(0, count - lim.includedStores) : 0, extraStoreCents: lim?.extraStoreCents || 0, subscriptionId: primary?.subscription?.stripeSubscriptionId || null, extraStoreItemId: primary?.subscription?.extraStoreItemId || null };
}
export async function setExtraStoreItemId(orgId, itemId) {
    await StorefrontSite.updateOne({ orgId, plan: { $ne: "none" } }, { $set: { "subscription.extraStoreItemId": itemId || undefined } });
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

// AI header-menu designer: builds a header menu (sections + links + emoji icons) from the store's
// real catalog taxonomy + business info. Returns { links } the editor drops into nav.links.
export async function generateMenu(orgIdStr, { style = "links", target = "header" } = {}) {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, cats, depts, collections, pages] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo policies").lean(),
        PlatformProduct.distinct("category", { orgId, active: { $ne: false } }),
        PlatformProduct.distinct("department", { orgId, active: { $ne: false } }),
        StorefrontCollection.find({ orgId, status: "published" }).select("slug title").limit(40).lean(),
        StorefrontPage.find({ orgId, status: "published" }).select("slug title").limit(40).lean(),
    ]);
    const taxonomy = [...new Set([...(depts || []), ...(cats || [])].flat().filter(Boolean).map(String))].slice(0, 40);
    const collectionList = (collections || []).map((c) => `"${c.title}" → /collections/${c.slug}`);
    const pageList = (pages || []).map((p) => `"${p.title}" → /${p.slug}`);
    const policyList = (site?.policies || []).filter((p) => p?.slug && p?.body).map((p) => `"${p.title || p.slug}" → /policies/${p.slug}`);
    const client = await anthropic();
    const bio = site?.businessInfo?.description || site?.businessInfo?.tagline || "";

    const isFooter = target === "footer";
    const prompt = isFooter
        ? `Design a clean storefront FOOTER as JSON — a few columns of links.
Store name: "${site?.name || "the store"}". About: ${bio || "(not provided)"}.
Product categories/departments: ${taxonomy.join(", ") || "(none)"}.
Published collections (use exact hrefs): ${collectionList.length ? collectionList.join("; ") : "(none)"}.
Published landing pages (About/Contact/etc — use exact hrefs): ${pageList.length ? pageList.join("; ") : "(none)"}.
Legal/policy pages (use exact hrefs): ${policyList.length ? policyList.join("; ") : "(none)"}.
Rules:
- 2 to 4 COLUMNS. Each column is a top item with a "label" heading and a "children" array of links. Typical columns: "Shop" (categories/collections), "Company" (About/landing pages), "Support"/"Help" (Contact + policy pages).
- Put the legal/policy pages under a Support/Legal column. Include an "All products" ("/products") link under Shop.
- Use the given exact hrefs for collections/landing/policy pages; otherwise category links use "/products/<slug>" (category lowercased, spaces as hyphens).
- Columns themselves have no href. Keep labels short. Emoji "icon" is OPTIONAL for footer (omit unless it clearly helps).
STRICT JSON only: {"links":[{"label":"","icon":"","children":[{"label":"","href":"","icon":""}]}]}.`
        : `Design a clean storefront header menu as JSON for a ${style === "drawer" ? "slide-out drawer" : "horizontal links"} menu.
Store name: "${site?.name || "the store"}". About: ${bio || "(not provided)"}.
Product categories/departments: ${taxonomy.join(", ") || "(none yet — use generic apparel/shop sections)"}.
Published collections (prefer these for curated sections — use their exact hrefs): ${collectionList.length ? collectionList.join("; ") : "(none)"}.
Published landing pages (link to relevant ones, e.g. About/lookbooks — use their exact hrefs): ${pageList.length ? pageList.join("; ") : "(none)"}.
Rules:
- 4 to 6 top-level items. Include Home ("/") first and an "All products" link ("/products").
- Group related items under dropdown sections (a top item with a "children" array). Favor real collections and landing pages over inventing categories.
- Collection links use their given "/collections/<slug>"; landing-page links use their given "/<slug>"; otherwise category links use "/products/<slug>" (category lowercased, spaces as hyphens).
- Give every item and child ONE relevant emoji as "icon". Keep labels short (1-2 words).
STRICT JSON only: {"links":[{"label":"","href":"","icon":"","children":[{"label":"","href":"","icon":""}]}]}. Omit "children" for plain links.`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 1500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    const out = parseJson(textOf(msg));
    const trim = (s, n) => String(s || "").slice(0, n);
    const links = (Array.isArray(out.links) ? out.links : []).slice(0, 8).map((l) => ({
        label: trim(l.label, 40), href: trim(l.href, 200), icon: trim(l.icon, 4),
        ...(Array.isArray(l.children) && l.children.length
            ? { children: l.children.slice(0, 12).map((c) => ({ label: trim(c.label, 40), href: trim(c.href, 200), icon: trim(c.icon, 4) })).filter((c) => c.label) }
            : {}),
    })).filter((l) => l.label);
    return { links };
}

// AI copy for the customizable system pages (404 / error). On-brand, friendly, grounded in the
// store's name + business info. Returns { title, message, ctaText, ctaLink? }.
export async function generateSystemPage(orgIdStr, { kind = "notFound", withImage = true } = {}) {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const site = await StorefrontSite.findOne({ orgId }).select("name businessInfo").lean();
    const client = await anthropic();
    const bio = site?.businessInfo?.description || site?.businessInfo?.tagline || "";
    const isError = kind === "error";
    const prompt = isError
        ? `Write warm, reassuring copy for an online store's ERROR page (shown when something goes wrong). Store: "${site?.name || "the store"}".${bio ? ` About: ${bio}.` : ""} On-brand, human, not technical — reassure them and invite them to retry. Also include "imagePrompt": a short description of a tasteful, TEXT-FREE background image that fits the brand (soft/atmospheric so overlaid white text stays readable). STRICT JSON only: {"title":"short heading","message":"1-2 sentence reassurance","ctaText":"button label, e.g. Try again","imagePrompt":"..."}.`
        : `Write friendly, on-brand copy for an online store's 404 NOT-FOUND page. Store: "${site?.name || "the store"}".${bio ? ` About: ${bio}.` : ""} Playful but helpful — acknowledge the page is missing and nudge them back to shopping. Also include "imagePrompt": a short description of a tasteful, TEXT-FREE background image that fits the brand (soft/atmospheric so overlaid white text stays readable). STRICT JSON only: {"title":"short heading","message":"1-2 sentence helpful note","ctaText":"button label, e.g. Shop all","ctaLink":"/products","imagePrompt":"..."}.`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 700, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    const out = parseJson(textOf(msg));
    const trim = (s, n) => String(s || "").slice(0, n);

    // Optionally generate an on-brand background image (Gemini → Wasabi URL). Best-effort.
    let backgroundImage;
    if (withImage && out.imagePrompt && sceneGenAvailable()) {
        try {
            backgroundImage = await generateImage({ prompt: `${out.imagePrompt}. No text, no words, no letters. Atmospheric, soft, slightly darkened so white text reads on top.`, aspect: 1.6, orgId: orgIdStr });
        } catch { /* keep copy-only */ }
    }

    return {
        title: trim(out.title, 80),
        message: trim(out.message, 280),
        ctaText: trim(out.ctaText, 40),
        ...(isError ? {} : { ctaLink: trim(out.ctaLink || "/products", 200) }),
        ...(backgroundImage ? { backgroundImage } : {}),
    };
}

// AI builder for a custom-HTML homepage section. Generates a self-contained, theme-matched HTML block
// from a description; when `currentHtml` is supplied, applies the change and returns the FULL updated
// HTML (so sellers can iterate). Returns { html } (sanitized again at render time).
export async function generateSection(orgIdStr, { prompt, currentHtml } = {}) {
    if (!prompt) throw httpError(400, "prompt is required");
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo theme").lean(),
        catalogContext(orgId),
    ]);
    const client = await anthropic();
    const bio = site?.businessInfo?.description || site?.businessInfo?.tagline || "";
    const editing = !!(currentHtml && currentHtml.trim());
    const system = `You build ONE self-contained HTML section for an online store's homepage.
Output rules (STRICT):
- Output ONLY raw HTML for the single section. No <html>/<head>/<body>, no <script>, no markdown code fences, no commentary.
- Inline styles only (no <style> or <script> — scripts are stripped on render).
- Match the store theme via CSS variables: var(--sf-accent), var(--sf-secondary), var(--sf-primary), var(--sf-text), var(--sf-bg), and fonts var(--sf-font-heading) / var(--sf-font-body).
- Be responsive: flex/grid with wrap, %/max-width, sensible padding. Wrap inner content in <div class="sf-container"> for aligned page width unless a full-bleed background band is intended.
- Tasteful, modern, accessible. Use real placeholder copy relevant to the store.
- IMAGES: when a photo helps, use <img> with src="IMG[<vivid scene description>]" — these become AI-generated photorealistic product/lifestyle photos (no text in the image). Style each <img> with width:100%/height/object-fit:cover. Keep existing https image URLs as-is when editing. For multiple images, prefer an IMAGE COLLAGE — a responsive CSS-grid mosaic of varied-size tiles (small gaps, rounded corners, lookbook-style) that collapses to 1-2 columns on mobile.
- HERO / banner blocks: give the band a real BACKGROUND — either a solid theme color (background:var(--sf-primary) or var(--sf-accent) with readable text) OR a full-bleed background image (position the band relative; an absolutely-positioned inset IMG[...] with object-fit:cover behind a semi-transparent overlay for legibility). Then LAYER 1-3 foreground product images ON TOP of that background (IMG[<product cut-out on a plain/transparent background>]) arranged as an overlapping showcase row with drop-shadows, sitting above the headline/CTA. Background + overlay-on-top is the preferred hero treatment.
Store: "${site?.name || "the store"}".${bio ? ` About: ${bio}.` : ""}${themeBlock(site?.theme)}${groundingBlock(ctx)}`;
    const userMsg = editing
        ? `Current section HTML:\n\n${currentHtml}\n\nApply this change and return the FULL updated HTML:\n${prompt}`
        : `Create this section:\n${prompt}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 3000, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: userMsg }] });
    let html = textOf(msg).trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();   // strip accidental fences
    html = await substituteAiImages(html, orgIdStr);   // resolve any IMG[...] placeholders → real photos
    return { html };
}

// AI collage designer: build a full image-collage layout (rows → columns → stacked cells) from a
// description, with AI-generated photos per tile. Returns { rows } in the ImageCollage settings.rows
// shape: [{ height, tiles:[{ width, cells:[{ image, label, sublabel, link }] }] }].
export async function generateCollage(orgIdStr, { prompt, current } = {}) {
    if (!prompt) throw httpError(400, "prompt is required");
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx, links] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo theme").lean(),
        catalogContext(orgId),
        siteLinksContext(orgId),
    ]);
    const client = await anthropic();
    const editing = Array.isArray(current) && current.length > 0;
    const system = `You design an IMAGE COLLAGE (lookbook mosaic) for an online store homepage section. Return STRICT JSON ONLY, no prose, no code fences:
{"rows":[{"height":<px 200-420>,"tiles":[{"width":<relative 1-3>,"cells":[{"imageDesc":"<vivid photo description>","label":"<short overlay caption or empty>","sublabel":"<optional small line or empty>","link":"<real path>"}]}]}]}
RULES:
- 1-3 rows; each row has 2-4 tiles (columns). For visual variety, some columns may STACK 1-2 cells vertically ("cells" with 2 entries) — most columns have a single cell. Vary tile widths (e.g. a width:2 feature beside two width:1 tiles) and row heights for a dynamic, editorial mosaic.
- imageDesc: photorealistic product/lifestyle photography of the store's REAL product types — specific (worn/used, the people, the setting, the season/mood). NEVER any text/words in the image.
- label/sublabel: SHORT merchandising captions ("New Arrivals", "Shop Tees") — optional; many tiles should have NO label. NEVER invent product names, prices, or sales.
- link: real paths only (default "/products"; use /collections/<slug> when relevant).
Store: "${site?.name || "the store"}".${themeBlock(site?.theme)}${groundingBlock(ctx)}${linksBlock(links)}`;
    const currentForAi = editing ? current.map((r) => ({ height: r?.height, tiles: (r?.tiles || []).map((t) => ({ width: t?.width, cells: (t?.cells || []).map((c) => ({ label: c?.label || "", sublabel: c?.sublabel || "", link: c?.link || "", hasImage: !!c?.image })) })) })) : null;
    const userMsg = editing
        ? `Current collage JSON (images shown as hasImage; keep good ones, change what's asked):\n${JSON.stringify(currentForAi)}\n\nApply this change and return the FULL updated collage JSON:\n${prompt}`
        : `Design this collage:\n${prompt}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 2500, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: userMsg }] });
    const parsed = parseJson(textOf(msg)) || {};
    const rowsRaw = Array.isArray(parsed.rows) ? parsed.rows : [];

    // Generate a real photo per unique imageDesc (parallel, capped). Empty if image gen is off → cells
    // fall back to a colored tile + label (layout still builds).
    const descs = [];
    for (const r of rowsRaw) for (const t of (r?.tiles || [])) for (const c of (t?.cells || [])) { const d = String(c?.imageDesc || "").trim(); if (d && !descs.includes(d) && descs.length < 8) descs.push(d); }
    const urls = {};
    if (sceneGenAvailable()) {
        await Promise.all(descs.map(async (d) => {
            try { urls[d] = await generateImage({ prompt: `${d}. Photorealistic product/lifestyle photography, on-brand, natural lighting, no text, no words, no watermark.`, aspect: 1, orgId: orgIdStr }); } catch { /* skip on failure */ }
        }));
    }
    const rows = rowsRaw.map((r) => ({
        height: Math.min(600, Math.max(140, Number(r?.height) || 240)),
        tiles: (r?.tiles || []).map((t) => ({
            width: Math.min(4, Math.max(1, Number(t?.width) || 1)),
            cells: (t?.cells || []).slice(0, 2).map((c) => ({
                image: urls[String(c?.imageDesc || "").trim()] || "",
                label: String(c?.label || "").slice(0, 40),
                sublabel: String(c?.sublabel || "").slice(0, 60),
                link: String(c?.link || "/products").slice(0, 200),
            })).filter((c) => c.image || c.label),
        })).filter((t) => t.cells.length),
    })).filter((r) => r.tiles.length);
    return { rows };
}

// Per-section AI copywriter: which settings fields each section type lets AI rewrite, with a hint.
const SECTION_AI_FIELDS = {
    hero:             { headline: "main headline (short, punchy)", subheadline: "1 supporting sentence", ctaText: "button label", ctaLink: "button link path e.g. /products", backgroundColor: "hex background color e.g. #0f172a — ONLY if a solid color suits; omit otherwise" },
    featuredProducts: { heading: "grid heading", query: "a search term that matches REAL catalog items, or omit" },
    collection:       { heading: "section heading" },
    richText:         { heading: "heading", body: "1-3 sentences of body copy" },
    imageCollage:     { heading: "heading", subheading: "subheading" },
};

// Rewrite ONE section's text/style settings from a natural-language request (grounded in catalog + theme).
// Returns { fields } — a partial settings patch (only changed keys). Used by the per-section "Edit with AI".
export async function generateSectionFields(orgIdStr, { type, settings = {}, prompt } = {}) {
    if (!prompt) throw httpError(400, "prompt is required");
    const spec = SECTION_AI_FIELDS[type];
    if (!spec) return { fields: {} };          // e.g. customHtml uses its own HTML AI
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo theme").lean(),
        catalogContext(orgId),
    ]);
    const client = await anthropic();
    const keys = Object.entries(spec).map(([k, h]) => `"${k}": <${h}>`).join(", ");
    const current = Object.fromEntries(Object.keys(spec).map((k) => [k, settings?.[k] ?? ""]));
    const system = `You write copy for ONE section of an online store. Return STRICT JSON only, including ONLY the fields you are changing: { ${keys} }. Omit fields you leave as-is. Keep it concise, on-brand, and consistent with the real catalog. Links must be real paths (e.g. /products, /collections/<slug>). Colors are hex.${themeBlock(site?.theme)}${groundingBlock(ctx)}`;
    const userMsg = `Section type: ${type}. Current values: ${JSON.stringify(current)}.\nChange request: ${prompt}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 800, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: userMsg }] });
    const parsed = parseJson(textOf(msg)) || {};
    const fields = {};
    for (const k of Object.keys(spec)) if (parsed[k] != null && parsed[k] !== "") fields[k] = parsed[k];
    return { fields };
}

// AI-write an SEO meta title + description for the site homepage or a landing page. Grounded in the real
// catalog/business so it never promises products the store doesn't sell. Returns { title, description }.
export async function generateSeoMeta(orgIdStr, { title = "", hint = "", kind = "site" } = {}) {
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo").lean(),
        catalogContext(orgId),
    ]);
    const bio = site?.businessInfo?.description || site?.businessInfo?.tagline || "";
    const subject = kind === "page"
        ? `a landing/campaign page titled "${title || "this page"}" on the online store "${site?.name || "the store"}".${hint ? ` Page content: ${String(hint).slice(0, 600)}.` : ""}`
        : `the homepage of the online store "${site?.name || "the store"}".${bio ? ` About: ${bio}.` : ""}`;
    const client = await anthropic();
    const system = `You write SEO metadata for an online store. Return STRICT JSON ONLY: {"title":"<meta title, MAX 60 chars>","description":"<meta description, MAX 155 chars>"}. Make it compelling and keyword-rich but honest — reflect the REAL catalog, no clickbait, no invented products/prices/claims. Include the store/brand name in the title where it fits.${groundingBlock(ctx)}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 400, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: `Write the SEO title and meta description for ${subject}` }] });
    const out = parseJson(textOf(msg)) || {};
    return { title: String(out.title || "").slice(0, 70), description: String(out.description || "").slice(0, 170) };
}

// Grounding context so AI builders only reference products the store ACTUALLY sells (no invented items).
async function catalogContext(orgId) {
    const [products, cats, depts] = await Promise.all([
        PlatformProduct.find({ orgId, active: { $ne: false } }).select("title variantsArray").sort({ _id: -1 }).limit(60).lean(),
        PlatformProduct.distinct("category", { orgId, active: { $ne: false } }),
        PlatformProduct.distinct("department", { orgId, active: { $ne: false } }),
    ]);
    const titles = [...new Set(products.map((p) => p.title).filter(Boolean))].slice(0, 40);
    const prices = products.flatMap((p) => (p.variantsArray || []).map((v) => v.price).filter((n) => n > 0));
    const priceRange = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
    const categories = [...new Set([...(depts || []), ...(cats || [])].flat().filter(Boolean).map(String))].slice(0, 30);
    return { titles, categories, priceRange };
}

// Builds the "only sell what we sell" grounding block for AI section/page prompts.
function groundingBlock({ titles, categories, priceRange }) {
    if (!titles.length && !categories.length) return "";
    return `\nGROUNDING — this store ONLY sells the items below. NEVER invent products, product names, prices, sales, brands, categories, or claims. If something doesn't fit the catalog, leave it out.
${categories.length ? `Product types sold: ${categories.join(", ")}.` : ""}
${titles.length ? `Actual products (CONTEXT ONLY — keep copy consistent with these; do not introduce anything the store doesn't sell): ${titles.join("; ")}.` : ""}
Imagery (IMG[...]) must depict the store's REAL product types (e.g. apparel/tees) in the theme's context — never a product the store doesn't carry (e.g. no soccer jerseys if not sold). CTAs link to /products.`;
}

// Existing published landing pages + collections — used to (a) keep new pages on a DISTINCT angle (no
// near-duplicate/doorway pages) and (b) add contextual INTERNAL LINKS for SEO + crawlability.
async function siteLinksContext(orgId) {
    const [pages, collections] = await Promise.all([
        StorefrontPage.find({ orgId, status: "published" }).select("title slug").limit(40).lean(),
        StorefrontCollection.find({ orgId, status: "published" }).select("title slug").limit(40).lean(),
    ]);
    return {
        pages: (pages || []).map((p) => ({ title: p.title || p.slug, href: `/${p.slug}` })),
        collections: (collections || []).map((c) => ({ title: c.title || c.slug, href: `/collections/${c.slug}` })),
    };
}
function linksBlock({ pages = [], collections = [] }) {
    const all = [...pages, ...collections];
    const parts = [];
    if (pages.length) parts.push(`\nUNIQUE ANGLE — target a DISTINCT topic/keyword from the store's existing pages; do NOT duplicate or closely mirror these: ${pages.map((p) => `"${p.title}"`).join(", ")}.`);
    if (all.length) parts.push(`\nINTERNAL LINKS — where it reads naturally, add 1-2 contextual links to related destinations (use these EXACT hrefs): ${all.map((x) => `"${x.title}" → ${x.href}`).join("; ")}.`);
    return parts.join("");
}

// Tells the AI the store's ACTUAL palette/fonts so it can design for them (contrast, which color goes
// where) while still emitting the var(--sf-*) variables so the output stays themeable.
function themeBlock(theme = {}) {
    const c = theme?.colors || {}, f = theme?.fonts || {};
    const cols = [
        c.primary && `primary ${c.primary} → var(--sf-primary)`,
        c.secondary && `secondary ${c.secondary} → var(--sf-secondary)`,
        c.accent && `accent ${c.accent} → var(--sf-accent)`,
        c.background && `background ${c.background} → var(--sf-bg)`,
        c.text && `text ${c.text} → var(--sf-text)`,
    ].filter(Boolean);
    if (!cols.length) return "";
    return `\nTHEME — design for this real palette (always OUTPUT the matching var(--sf-*) variable, not the hex). Pick combinations with strong contrast/readability (e.g. dark text on light backgrounds, white text on the accent): ${cols.join("; ")}.${(f.heading || f.body) ? ` Fonts: headings var(--sf-font-heading) (${f.heading || "Inter"}), body var(--sf-font-body) (${f.body || "Inter"}).` : ""}`;
}

// Replace AI image placeholders `IMG[<description>]` in generated HTML with real AI-generated photos
// (Gemini → Wasabi URL). Up to 4, generated in parallel. If image gen is off or a generation fails,
// the <img> referencing the unresolved placeholder is removed so there are no broken images.
async function substituteAiImages(html, orgIdStr, maxImages = 4) {
    if (!html) return html;
    let out = html;
    const urls = {};
    if (sceneGenAvailable()) {
        const descs = [];
        const re = /IMG\[([^\]]+)\]/g; let m;
        while ((m = re.exec(out)) !== null) { const d = m[1].trim(); if (d && !descs.includes(d) && descs.length < maxImages) descs.push(d); }
        await Promise.all(descs.map(async (d) => {
            try { urls[d] = await generateImage({ prompt: `${d}. Photorealistic product/lifestyle photography, on-brand, natural lighting, no text, no words, no watermark.`, aspect: 1.5, orgId: orgIdStr }); } catch { /* skip on failure */ }
        }));
    }
    // Rewrite each <img> whose src is an IMG[...] placeholder: swap to the real URL AND set descriptive
    // alt text (SEO + accessibility). Drop the <img> entirely if the image couldn't be generated.
    const altOf = (d) => d.replace(/\s+/g, " ").replace(/"/g, "").trim().slice(0, 120);
    out = out.replace(/<img\b[^>]*?>/gi, (tag) => {
        const m = tag.match(/IMG\[([^\]]+)\]/);
        if (!m) return tag;                       // a normal <img> (e.g. real product URL) — leave it
        const d = m[1].trim();
        const url = urls[d];
        if (!url) return "";                      // unresolved placeholder → remove the img
        let t = tag.replace(/IMG\[[^\]]*\]/, url);
        const alt = altOf(d);
        t = /\salt\s*=/.test(t)
            ? t.replace(/\salt\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ` alt="${alt}"`)
            : t.replace(/<img\b/i, `<img alt="${alt}"`);
        return t;
    });
    out = out.replace(/IMG\[[^\]]*\]/g, "");        // strip any stray markers outside <img>
    return out;
}

// Prompt builder: turn a seller's rough idea into a clear, vivid brief for the page/section AI builder —
// grounded in the real catalog so it never suggests products the store doesn't sell. Returns { prompt }.
export async function improvePrompt(orgIdStr, { idea, kind = "landing" } = {}) {
    if (!idea || !String(idea).trim()) throw httpError(400, "idea is required");
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo").lean(),
        catalogContext(orgId),
    ]);
    const client = await anthropic();
    // kind "image" → expand a rough image idea into a vivid photo brief for the image generator.
    if (kind === "image") {
        const system = `You turn a store owner's rough idea into a vivid PHOTO brief for an AI image generator producing a single product/lifestyle photo for their online store.
Output ONLY the improved description as 1-2 natural sentences — no preamble, no quotes, no labels. Be specific about: the subject (a real product TYPE the store sells, worn/used), the people, the setting/background, the lighting, the mood/season, and the composition. Photorealistic. NEVER put text/words in the image, and never invent a specific named product the store doesn't carry.
Store: "${site?.name || "the store"}".${groundingBlock(ctx)}`;
        const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 400, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: `Rough image idea: ${String(idea).trim()}` }] });
        return { prompt: textOf(msg).trim().replace(/^["']|["']$/g, "").slice(0, 600) };
    }
    const target = kind === "section" ? "a single homepage section" : "a landing / campaign page";
    const system = `You turn a store owner's rough idea into a clear, vivid BRIEF for an AI that builds ${target} for their online store.
Output ONLY the improved brief as 2-4 natural sentences — no preamble, no bullet points, no quotes, no labels. Make it specific and actionable: the angle/hook, who it's for, the structure (hero, value props, lifestyle imagery, closing CTA), the tone/mood, and the call to action. Reference only product TYPES the store actually sells; never invent specific products, prices, or claims.
Store: "${site?.name || "the store"}".${site?.businessInfo?.description ? ` About: ${site.businessInfo.description}.` : ""}${groundingBlock(ctx)}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 600, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: `Rough idea: ${String(idea).trim()}` }] });
    return { prompt: textOf(msg).trim().replace(/^["']|["']$/g, "").slice(0, 1200) };
}

// AI builder for a whole landing/campaign page: returns title + slug + SEO meta + an ARRAY of section
// HTML blocks (each becomes its own custom-HTML section so the seller can reorder/edit/delete them).
// Marker format (not JSON) so the HTML's quotes don't break parsing.
export async function generateLandingPage(orgIdStr, { prompt } = {}) {
    if (!prompt) throw httpError(400, "prompt is required");
    const orgId = new mongoose.Types.ObjectId(orgIdStr);
    const [site, ctx, links] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("name businessInfo theme").lean(),
        catalogContext(orgId),
        siteLinksContext(orgId),
    ]);
    const client = await anthropic();
    const bio = site?.businessInfo?.description || site?.businessInfo?.tagline || "";
    const system = `You build a complete landing/campaign page for an online store. Return EXACTLY this format and nothing else (no markdown fences, no commentary):
TITLE: <page title, max 70 chars>
SLUG: <url-safe slug, lowercase words separated by hyphens, e.g. summer-sale>
SEO_TITLE: <meta title, max 60 chars>
SEO_DESCRIPTION: <meta description, max 155 chars>
PRODUCT_QUERY: <a short search query (1-3 words) that surfaces the most RELEVANT products for this page from the real catalog, e.g. "fathers day" or "grilling bbq" — pick terms that appear in the products/categories above. Leave blank only if nothing in the catalog is relevant.>
PRODUCT_HEADING: <heading for that products grid, e.g. "Shop Father's Day">
---SECTIONS---
<section 1 HTML>
---SECTION---
<section 2 HTML>
---SECTION---
<section 3 HTML>

STRUCTURE: build the page as 3-6 SEPARATE sections so each can be edited/reordered/removed on its own. Separate each with a line containing only ---SECTION--- . A typical flow: (1) hero with headline + CTA, (2) value props / benefits, (3) an image-collage / lookbook block, (4) story or social proof, (5) a closing CTA band. Each section is its own self-contained block (its own <section> with its own padding and, where it helps, its own background).
HTML rules (per section): inline styles only; NO <script> or <style>; responsive (flex/grid wrap, %/max-width); match the theme via CSS vars var(--sf-accent), var(--sf-secondary), var(--sf-primary), var(--sf-text), var(--sf-bg), fonts var(--sf-font-heading)/var(--sf-font-body); wrap inner content in <div class="sf-container"> for aligned width; include at least one clear call-to-action button linking to /products (or a relevant path). Tasteful, modern, on-brand.
NO INVENTED PRODUCTS (critical): do NOT name a specific product, show any price or sale price ("$.."), or build product cards / a "featured product" in your sections. Real products are shown ONLY by a live grid added automatically below. Your sections are EDITORIAL — theme, hero, lifestyle/collage imagery, value props, brand story, and CTA buttons (text like "Shop the Collection" → /products). Reference product TYPES generally (e.g. "tees", "apparel"), never a made-up named item.
IMAGES (important): LEAN ON REAL IMAGERY, not flat color blocks. Use <img> with src="IMG[<vivid scene description>]" — these become AI-generated photorealistic product/lifestyle photos. Include a hero image plus 1-3 supporting product/lifestyle shots (2-4 images total). Describe each specifically: the product being worn/used, the people, the setting, the mood/season. Style every <img> with width:100%; height matching its slot; object-fit:cover; border-radius where it fits. Never put text inside an image.
USE AN IMAGE COLLAGE for the supporting imagery where it fits — a responsive CSS-grid mosaic of 2-4 tiles with varied sizes (e.g. one tall tile beside two stacked, or a 2x2), small gaps, rounded corners, lookbook-style. Each tile is its own IMG[...] image; on mobile it should collapse to 1-2 columns.
HERO SECTION: give it a real BACKGROUND — a solid theme color (background:var(--sf-primary) or var(--sf-accent), readable text) OR a full-bleed background image (relative band + an absolutely-positioned inset IMG[...] with object-fit:cover behind a semi-transparent dark overlay for legibility). Then LAYER 1-3 foreground product images ON TOP of that background (IMG[<product cut-out, plain/transparent background>]) as an overlapping showcase row with drop-shadows, above the headline + CTA. Background + images-on-top is the preferred hero treatment (don't make the hero a plain flat color with no imagery).
Store: "${site?.name || "the store"}".${bio ? ` About: ${bio}.` : ""}${themeBlock(site?.theme)}${groundingBlock(ctx)}${linksBlock(links)}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 4000, thinking: { type: "adaptive" }, system, messages: [{ role: "user", content: `Build this landing page:\n${prompt}` }] });
    const text = textOf(msg);
    const grab = (re) => { const m = text.match(re); return m ? m[1].trim() : ""; };
    const mark = "---SECTIONS---";
    const idx = text.indexOf(mark);
    let body = idx >= 0 ? text.slice(idx + mark.length).trim() : text;
    body = body.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    body = await substituteAiImages(body, orgIdStr, 6);   // swap IMG[...] placeholders for AI photos (whole page budget)
    const ogImage = (body.match(/<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/i) || [])[1] || "";   // first photo → social share image
    const sections = body.split(/\n?\s*-{2,}\s*SECTION\s*-{2,}\s*\n?/i).map((h) => h.trim()).filter(Boolean);
    const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    const title = grab(/TITLE:\s*(.+)/) || "New landing page";
    return {
        title: title.slice(0, 80),
        slug: slugify(grab(/SLUG:\s*(.+)/) || title),
        seoTitle: grab(/SEO_TITLE:\s*(.+)/).slice(0, 70),
        seoDescription: grab(/SEO_DESCRIPTION:\s*(.+)/).slice(0, 170),
        productQuery: grab(/PRODUCT_QUERY:\s*(.+)/).slice(0, 60),
        productHeading: grab(/PRODUCT_HEADING:\s*(.+)/).slice(0, 60) || "Shop the collection",
        ogImage,
        sections: sections.length ? sections : [body],
    };
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

// AI section suggestions for the storefront EDITOR — returns the editor's {type, settings} shape,
// constrained to the section types the renderer + manifest actually support.
export async function aiSections({ brand = "our store", pageTitle = "Home", prompt = "", orgId } = {}) {
    const client = await anthropic();
    // Give the model real catalog context (categories/tags it can target) so collage tiles map to products.
    const catalog = orgId ? await catalogHints(orgId) : null;
    const catalogNote = catalog
        ? `\nThis store's catalog includes categories: ${catalog.categories.join(", ") || "(various)"}. Common product keywords: ${catalog.keywords.join(", ") || "(various)"}. Prefer tile "query" values that match these so each tile lands on real products.`
        : "";

    const ask = `You are designing the "${pageTitle}" page for the online store "${brand}".${prompt ? ` The merchant's request: "${prompt}".` : ""}${catalogNote}
Compose an ordered list of page sections using ONLY these section types:
- "hero" — settings: { "headline", "subheadline", "ctaText", "ctaLink" (default "/products"), "align": "left"|"center"|"right" }
- "featuredProducts" — settings: { "heading", "query" (optional search to curate the grid, e.g. "4th of july"), "limit" (integer 4-12) }
- "richText" — settings: { "heading", "body" (use \\n\\n between paragraphs), "align": "left"|"center"|"right" }
- "imageCollage" — a grid of clickable image tiles for merchandising a theme or collection. settings:
  { "heading", "subheading",
    "rows": [ { "height": 220-420, "tiles": [ { "width": 1-3, "cells": [ { "label", "sublabel", "query", "scene"? } ] } ] } ] }
  Each cell becomes a button that links to a search for its "query". A "tiles" entry is a COLUMN that can hold one cell or several STACKED cells (the "cells" array). Vary layouts for visual interest (e.g. one wide tile beside two stacked narrow ones, or a 3-up row). Give EVERY cell a concrete "query" that a shopper would search and that matches real products (e.g. for a July 4th theme: "men's patriotic t-shirt", "women's american flag tank", "kids 4th of july shirt", "stars and stripes hat"). Provide short punchy "label" and optional "sublabel".
  For the 1-2 LARGEST / feature tiles (width 2-3, single cell), also add a "scene": a short lifestyle-photo description of people enjoying the moment while WEARING the product (e.g. "a family sitting on a blanket watching fireworks on a warm summer evening, smiling, wearing matching tees"). The system will render that scene as a real photo featuring the client's actual shirt design. Only add "scene" to big feature tiles, not small ones.
  Do NOT include any image URLs — the system fills tile images automatically from the store's catalog and AI scene renders.

Rules: Honor the merchant's request exactly — if they ask for an image collage on a theme, make the first section an "imageCollage" built around that theme with 3-6 tiles. Write compelling, on-brand copy — no lorem/placeholder text. Otherwise choose 2-5 sections that fit THIS page.
Respond with STRICT JSON only: {"sections":[{"type":"...","settings":{...}}, ...]}`;

    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 3500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: ask }] });
    const out = parseJson(textOf(msg));
    const allowed = new Set(["hero", "featuredProducts", "richText", "imageCollage"]);
    const sections = (Array.isArray(out?.sections) ? out.sections : [])
        .filter((s) => s && allowed.has(s.type))
        .map((s) => ({ type: s.type, settings: (s.settings && typeof s.settings === "object") ? s.settings : {} }));
    if (!sections.length) throw httpError(502, "AI returned no usable sections");

    // Fill collage tile images from the catalog (the model only supplies search "query"s).
    if (orgId) {
        for (const s of sections) {
            if (s.type === "imageCollage") await hydrateCollageImages(orgId, s.settings);
        }
    }
    return { sections };
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const firstImage = (p) => p?.productImages?.find?.((i) => i?.image)?.image || null;
// The client's actual printable artwork (Design.images is keyed by side; values are art URLs).
const designArtOf = (p) => {
    const imgs = p?.design?.images;
    if (!imgs || typeof imgs !== "object") return null;
    return imgs.front || imgs.Front || Object.values(imgs).find((v) => typeof v === "string" && v.startsWith("http")) || null;
};

// Lightweight catalog summary so the AI targets queries that exist (categories + frequent keywords).
async function catalogHints(orgId) {
    const products = await PlatformProduct.find({ orgId, active: { $ne: false } })
        .select("category tags").limit(400).lean().catch(() => []);
    const cats = new Map(), kw = new Map();
    for (const p of products) {
        if (p.category) cats.set(p.category, (cats.get(p.category) || 0) + 1);
        for (const t of (p.tags || [])) if (t) kw.set(t, (kw.get(t) || 0) + 1);
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    return { categories: top(cats, 12), keywords: top(kw, 20) };
}

// For each collage cell: set its search link, pick the best-matching catalog product, and use either a
// plain product photo or — for "feature" tiles the model marked with a "scene" — an AI-rendered
// lifestyle photo that composites the client's real design onto the shirt.
const MAX_SCENES_PER_COLLAGE = 3;   // bound cost/latency of image generation per AI run
async function hydrateCollageImages(orgId, settings) {
    const rows = Array.isArray(settings?.rows) ? settings.rows : [];
    const used = new Set();
    const canScene = sceneGenAvailable();
    let scenes = 0;
    for (const r of rows) {
        for (const col of (r?.tiles || [])) {
            for (const cell of (col?.cells || [])) {
                const q = (cell.query || cell.label || "").trim();
                if (!cell.link && q) cell.link = `/products?q=${encodeURIComponent(q)}`;
                if (!cell.image && q) {
                    const product = await pickCatalogProduct(orgId, q, used);
                    let img = null;
                    if (cell.scene && canScene && scenes < MAX_SCENES_PER_COLLAGE) {
                        scenes++;
                        let arts = await designArtsForQuery(orgId, q, 4);
                        if (!arts.length) arts = [designArtOf(product)].filter(Boolean);   // fall back to the tile's product
                        img = await generateSceneImage({ scene: cell.scene, designArtUrls: arts, theme: settings.heading || "", orgId });
                    }
                    cell.image = img || firstImage(product);
                }
                delete cell.query;
                delete cell.scene;
            }
        }
    }
    return settings;
}

// Find the product that best matches the tile's search terms (by keyword overlap). Returns the doc so
// callers can use both its photo (firstImage) and its design art (designArtOf) for scene rendering.
async function pickCatalogProduct(orgId, query, used, { allowFallback = true } = {}) {
    const base = { orgId, active: { $ne: false } };
    const words = (query.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2);
    let chosen = null;
    if (words.length) {
        const or = [];
        for (const w of words) { const rx = new RegExp(escapeRegex(w), "i"); or.push({ title: rx }, { tags: rx }, { category: rx }, { brand: rx }); }
        const candidates = await PlatformProduct.find({ ...base, $or: or })
            .select("title category brand tags productImages design").populate("design", "images").limit(80).lean().catch(() => []);
        const score = (p) => {
            const hay = [p.title, p.category, p.brand, ...(p.tags || [])].join(" ").toLowerCase();
            return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
        };
        candidates.sort((a, b) => score(b) - score(a));
        chosen = candidates.find((p) => firstImage(p) && !used.has(String(p._id))) || candidates.find((p) => firstImage(p));
    }
    if (!chosen && allowFallback) {
        // Nothing matched the theme — fall back to any product with an image so the tile isn't blank.
        chosen = await PlatformProduct.findOne({ ...base, "productImages.0": { $exists: true } })
            .select("productImages design").populate("design", "images").sort({ _id: -1 }).lean().catch(() => null);
    }
    if (chosen) used.add(String(chosen._id));
    return chosen;
}

// ── AI link migrator ─────────────────────────────────────────────────────────
// Onboarding a client from an old site: discover their old URLs, map them to the new structure (so we
// can 301 them and keep their SEO), and rewrite any old links pasted into the new store's content.

// Pull candidate paths from the old site: homepage links + its sitemap.xml.
async function crawlOldSite(base) {
    const origin = new URL(base).origin;
    const paths = new Set();
    const add = (href) => { try { const u = new URL(href, origin); if (u.origin === origin) paths.add((u.pathname.replace(/\/+$/, "") || "/")); } catch { /* skip */ } };
    try {
        const html = await (await fetch(base, { redirect: "follow", headers: { "User-Agent": "PythiasMigrator/1.0" } })).text();
        for (const m of html.matchAll(/href=["']([^"'#?]+)/gi)) add(m[1]);
    } catch { /* ignore */ }
    try {
        const xml = await (await fetch(origin + "/sitemap.xml")).text();
        for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) add(m[1].trim());
    } catch { /* ignore */ }
    return [...paths].filter((p) => p && p !== "/").slice(0, 300);
}

// Ask Claude to map each old path → a new-structure path using the store's real catalog/pages.
async function aiMapPaths(oldPaths, ctx) {
    if (!oldPaths.length) return [];
    const client = await anthropic();
    const lines = [
        `Map each OLD path from a store's previous website to the BEST new path on the new store. New URL structure:`,
        `- Products: /products/<slug>`,
        `- Shop / search: /products  (search is /products?q=…)`,
        `- Collections: /collections/<slug>`,
        `- Category/landing: /products/<term> or /products/<dept>/<category>`,
        `- Policies: /policies/terms | /policies/returns | /policies/privacy | /policies/shipping`,
        `- Home: /`,
        ``,
        `New store data:`,
        `Product slugs: ${(ctx.products || []).slice(0, 120).map((p) => p.slug).filter(Boolean).join(", ") || "(none yet)"}`,
        `Collection slugs: ${(ctx.collections || []).map((c) => c.slug).join(", ") || "(none)"}`,
        `Published page slugs: ${(ctx.pages || []).map((p) => p.slug).join(", ") || "(none)"}`,
        ``,
        `OLD paths to map:\n${oldPaths.map((p) => "- " + p).join("\n")}`,
        ``,
        `For each old path, pick the closest new path. Map common platform patterns sensibly: /pages/about→/about, /pages/{x}→ a policy if it's terms/privacy/returns/shipping else /{x}; /collections/all→/products; /collections/{x}→/collections/{x}; /search→/products; product pages → /products/<matching slug> (only if a real slug matches), else /products?q=<keywords>. Skip a path only if there is truly no sensible target. Respond with STRICT JSON only: {"redirects":[{"from":"/old","to":"/new"}, …]}`,
    ].join("\n");
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 4000, thinking: { type: "adaptive" }, messages: [{ role: "user", content: lines }] });
    const out = parseJson(textOf(msg));
    return (Array.isArray(out?.redirects) ? out.redirects : [])
        .filter((r) => r && typeof r.from === "string" && typeof r.to === "string" && r.from.startsWith("/") && r.to.startsWith("/") && r.from !== r.to)
        .map((r) => ({ from: r.from.replace(/\/+$/, "") || "/", to: r.to }));
}

// Find links in the new store's own draft content that still point at the OLD domain.
function scanInternalLinks(draft, oldOrigin) {
    const found = [];
    const host = (() => { try { return new URL(oldOrigin).host; } catch { return ""; } })();
    if (!host) return found;
    const seen = new Set();
    const consider = (href) => {
        if (typeof href !== "string" || !href.includes(host) || seen.has(href)) return;
        seen.add(href);
        try { found.push({ from: href, to: new URL(href).pathname || "/" }); } catch { /* skip */ }
    };
    for (const l of (draft?.nav?.links || [])) consider(l?.href);
    for (const l of (draft?.footer?.links || [])) consider(l?.href);
    for (const pg of (draft?.pages || [])) for (const s of (pg?.sections || [])) {
        const st = s?.settings || {};
        consider(st.ctaLink);
        for (const row of (st.rows || [])) for (const col of (row?.tiles || [])) for (const c of (col?.cells || [])) consider(c?.link);
    }
    return found;
}

export async function migrateLinks(orgId, { oldUrl } = {}) {
    const url = (oldUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) throw httpError(400, "Enter the old site's full URL, including https://");

    const oldPaths = await crawlOldSite(url);
    const site = await StorefrontSite.findOne({ orgId }).lean().catch(() => null);
    const [products, collections, pages] = await Promise.all([
        PlatformProduct.find({ orgId, active: { $ne: false } }).select("slug title").limit(200).lean().catch(() => []),
        StorefrontCollection.find({ orgId, status: "published" }).select("slug title").limit(200).lean().catch(() => []),
        StorefrontPage.find({ orgId, status: "published" }).select("slug title").limit(200).lean().catch(() => []),
    ]);

    // Old product URLs that ALREADY resolve on the new store (by slug or sku) need no redirect — the
    // catch-all resolves /products/<slug|sku|_id> directly (with a canonical tag to avoid duplicates).
    const rawSegs = oldPaths.map((p) => { const m = p.match(/^\/products\/([^/]+)$/); return m ? decodeURIComponent(m[1]) : null; }).filter(Boolean);
    const autoResolved = new Set();
    if (rawSegs.length) {
        const lc = rawSegs.map((s) => s.toLowerCase());
        const hits = await PlatformProduct.find({ orgId, active: { $ne: false }, $or: [{ slug: { $in: lc } }, { sku: { $in: [...new Set([...rawSegs, ...lc])] } }] }).select("slug sku").lean().catch(() => []);
        const have = new Set();
        for (const h of hits) { if (h.slug) have.add(String(h.slug).toLowerCase()); if (h.sku) have.add(String(h.sku).toLowerCase()); }
        for (const p of oldPaths) { const m = p.match(/^\/products\/([^/]+)$/); if (m && have.has(decodeURIComponent(m[1]).toLowerCase())) autoResolved.add(p); }
    }
    const toMap = oldPaths.filter((p) => !autoResolved.has(p));

    const redirects = await aiMapPaths(toMap, { products, collections, pages });
    const internal = scanInternalLinks(site?.draft || site, url);
    return { redirects, internal, crawled: oldPaths.length, autoResolved: autoResolved.size };
}

// Persist the chosen redirects (live + draft, so 301s work immediately and the editor keeps them) and
// rewrite any old-domain links found in the draft content.
export async function applyMigration(orgId, { redirects = [], internal = [] } = {}) {
    const site = await StorefrontSite.findOne({ orgId });
    if (!site) throw httpError(404, "Store not found");

    // Merge redirects (dedupe by `from`).
    const map = new Map((site.redirects || []).map((r) => [r.from, r.to]));
    let aliases = 0;
    for (const r of redirects) {
        if (!r?.from || !r?.to) continue;
        const from = r.from.replace(/\/+$/, "") || "/";
        // If an old PRODUCT handle maps to a new PRODUCT page, store the handle as an alias on that product
        // instead of a 301 — the catch-all then resolves it directly (canonical dedupes). Saves a redirect.
        const mFrom = from.match(/^\/products\/([^/]+)$/);
        const mTo = r.to.match(/^\/products\/([^/]+)$/);
        if (mFrom && mTo) {
            const handle = decodeURIComponent(mFrom[1]).toLowerCase();
            const target = decodeURIComponent(mTo[1]);
            const lcT = target.toLowerCase();
            const prod = await PlatformProduct.findOne({ orgId, $or: [{ slug: lcT }, { sku: target }, { sku: lcT }, { slugAliases: lcT }] }).select("_id").lean().catch(() => null);
            if (prod) { await PlatformProduct.updateOne({ _id: prod._id }, { $addToSet: { slugAliases: handle } }); aliases++; continue; }
        }
        map.set(from, r.to);
    }
    for (const r of internal) if (r?.from && r?.to) map.set(r.from, r.to);   // also redirect the old absolute URLs' paths
    site.redirects = [...map.entries()].map(([from, to]) => ({ from, to }));

    // Rewrite old-domain links sitting in the draft content (blunt full-string replace is safe for URLs).
    if (internal.length && site.draft) {
        let json = JSON.stringify(site.draft);
        for (const r of internal) if (r?.from && r?.to) json = json.split(r.from).join(r.to);
        try { site.draft = JSON.parse(json); } catch { /* keep original on parse failure */ }
    }
    await site.save();
    return { redirects: site.redirects.length, aliases };
}

// Up to `n` DISTINCT design artworks for products matching the query (best matches first). Used to give
// each person in a generated scene a different real design. Returns [] when nothing genuinely matches.
async function designArtsForQuery(orgId, query, n = 4) {
    const words = ((query || "").toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2);
    if (!words.length) return [];
    const or = [];
    for (const w of words) { const rx = new RegExp(escapeRegex(w), "i"); or.push({ title: rx }, { tags: rx }, { category: rx }, { brand: rx }); }
    const candidates = await PlatformProduct.find({ orgId, active: { $ne: false }, $or: or })
        .select("title category brand tags design").populate("design", "images").limit(80).lean().catch(() => []);
    const score = (p) => {
        const hay = [p.title, p.category, p.brand, ...(p.tags || [])].join(" ").toLowerCase();
        return words.reduce((acc, w) => acc + (hay.includes(w) ? 1 : 0), 0);
    };
    candidates.sort((a, b) => score(b) - score(a));
    const arts = [], seen = new Set();
    for (const p of candidates) {
        const art = designArtOf(p);
        const id = p.design?._id ? String(p.design._id) : art;
        if (art && id && !seen.has(id)) { seen.add(id); arts.push(art); if (arts.length >= n) break; }
    }
    return arts;
}

// Manual per-tile generator: the seller describes the image for ONE collage cell. We (1) draft a punchy
// label/sublabel + a shopper search query from the description, (2) find a matching product to borrow its
// design art so the shirt shows the client's real design, (3) render the image at the tile's aspect.
// Returns { url, label, sublabel, link } so the editor can fill the whole cell at once.
export async function generateTileImage(orgId, { prompt, aspect } = {}) {
    const p = (prompt || "").trim();
    if (!p) throw httpError(400, "Describe the image you want");
    if (!sceneGenAvailable()) throw httpError(503, "AI image generation isn't configured yet (missing GEMINI_API_KEY).");

    // 1. Copy + search query from the description.
    let meta = { label: "", sublabel: "", query: p };
    try {
        const client = await anthropic();
        const msg = await client.messages.create({
            model: "claude-opus-4-8", max_tokens: 400,
            messages: [{ role: "user", content:
                `An online store image tile is described as: "${p}". Respond with STRICT JSON only: {"label":"punchy title, <=4 words","sublabel":"supporting line, <=6 words or empty","query":"product search terms a shopper would type to find matching products"}.` }],
        });
        const out = parseJson(textOf(msg));
        if (out && typeof out === "object") meta = { label: out.label || "", sublabel: out.sublabel || "", query: out.query || p };
    } catch { /* fall back to description as query, no copy */ }

    // 2. Borrow several matching designs (so a multi-person scene can wear a DIFFERENT real design each) —
    //    genuine matches only, so a scenery description doesn't get unrelated designs forced onto it.
    let referenceUrls = [];
    try { referenceUrls = await designArtsForQuery(orgId, meta.query, 4); } catch {}

    // 3. Render at the requested aspect → data URL (editor loads it into the cropper, then uploads the crop).
    const dataUrl = await generateImageDataUrl({ prompt: p, referenceUrls, aspect });
    if (!dataUrl) throw httpError(502, "Image generation failed — please try again.");

    return { dataUrl, label: meta.label, sublabel: meta.sublabel, link: meta.query ? `/products?q=${encodeURIComponent(meta.query)}` : "" };
}

// Generate SEO slugs for products that don't have one (per-org unique). Powers the "slug" URL mode.
const slugifyProduct = (s) => String(s || "").toLowerCase().trim()
    .replace(/['’"]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export async function generateProductSlugs(orgId) {
    const taken = new Set();
    const withSlug = await PlatformProduct.find({ orgId, slug: { $nin: [null, ""] } }).select("slug").lean().catch(() => []);
    for (const p of withSlug) if (p.slug) taken.add(p.slug);

    const missing = await PlatformProduct.find({ orgId, $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] }).select("title sku").lean().catch(() => []);
    let updated = 0;
    for (const p of missing) {
        const base = slugifyProduct(p.title) || String(p._id);
        let s = base, n = 1;
        while (taken.has(s)) s = `${base}-${++n}`;
        taken.add(s);
        const update = { $set: { slug: s } };
        if (p.sku) update.$addToSet = { slugAliases: String(p.sku).toLowerCase() };   // SKU-handle URLs resolve
        await PlatformProduct.updateOne({ _id: p._id }, update);
        updated++;
    }
    return { updated, remaining: 0, total: withSlug.length + updated };
}

// Pre-generate SEO copy (h1 + description) for the curated indexable terms, so the /products/<term>
// landing pages serve it SERVER-SIDE in the HTML (crawlers see it) with zero AI on the page-load path.
// Bounded to the curated set; run from the SEO tab. Prunes content for terms no longer curated.
export async function generateTermDescriptions(orgId, { regenerate = false } = {}) {
    const site = await StorefrontSite.findOne({ orgId });
    if (!site) throw httpError(404, "Store not found");
    // Use the freshest curated terms (draft, since the seller may not have published yet).
    const src = (site.draft?.indexableTerms ?? site.indexableTerms) || [];
    const terms = [...new Set(src.map((t) => String(t).trim()).filter(Boolean))];
    if (!terms.length) { site.termContent = []; await site.save(); return { generated: 0 }; }

    const org = await Organization.findById(orgId).select("name").lean().catch(() => null);
    const brand = site.businessInfo?.legalName || site.name || org?.name || "our store";
    const existing = new Map((site.termContent || []).map((t) => [t.term, t]));
    const client = await anthropic();
    const out = [];
    let generated = 0;

    for (const term of terms) {
        const key = slugifyProduct(term);
        if (!regenerate && existing.get(key)?.description) { out.push(existing.get(key)); continue; }
        const rx = new RegExp(escapeRegex(term), "i");
        const sample = await PlatformProduct.find({ orgId, active: { $ne: false }, $or: [{ title: rx }, { tags: rx }, { category: rx }] })
            .select("title").limit(12).lean().catch(() => []);
        try {
            const msg = await client.messages.create({
                model: "claude-opus-4-8", max_tokens: 600,
                messages: [{ role: "user", content:
                    `Write SEO copy for the "${term}" collection/search landing page on the online store "${brand}". Example products: ${sample.map((p) => p.title).slice(0, 10).join("; ") || "various items"}. Return STRICT JSON only: {"h1":"page heading, <=8 words, includes the term naturally","description":"2-3 sentences, ~45-75 words, friendly and specific, uses the keyword naturally, no fluff or fake claims"}.` }],
            });
            const j = parseJson(textOf(msg));
            out.push({ term: key, h1: j?.h1 || "", description: j?.description || "" });
            generated++;
        } catch { out.push(existing.get(key) || { term: key, h1: "", description: "" }); }
    }
    site.termContent = out;
    await site.save();
    return { generated, total: terms.length };
}

// AI drafter for the built-in legal pages. Grounds the copy in the store's real business info; returns
// a starting draft the seller must review (we don't claim it's legal advice).
const POLICY_PROMPTS = {
    terms:    { title: "Terms of Service",   guide: "the rules for using the site and purchasing — accounts, orders & acceptance, pricing & payment, intellectual property, acceptable use, disclaimers, limitation of liability, and governing law" },
    returns:  { title: "Returns & Refunds",  guide: "the return window, item condition requirements, how to start a return, refund timing & method, exchanges, and that custom/personalized print-on-demand items are generally non-returnable unless defective or damaged" },
    privacy:  { title: "Privacy Policy",      guide: "what personal data is collected (contact, order, payment handled by the processor, analytics cookies), how it is used, who it is shared with (payment processors, shipping carriers, analytics), cookies, customer data rights, and how to contact the store about privacy" },
    shipping: { title: "Shipping Policy",     guide: "production/processing time for made-to-order items, shipping methods & delivery estimates, shipping costs, international shipping & customs/duties, order tracking, and lost or delayed packages" },
};

export async function generatePolicy(orgId, { slug } = {}) {
    const def = POLICY_PROMPTS[slug];
    if (!def) throw httpError(400, "Unknown policy type");

    const site = await StorefrontSite.findOne({ orgId }).lean().catch(() => null);
    const org = await Organization.findById(orgId).select("name").lean().catch(() => null);
    const b = site?.businessInfo || {};
    const name = b.legalName || site?.name || org?.name || "the Company";

    const facts = [`Business name: ${name}.`];
    if (b.email) facts.push(`Customer contact email: ${b.email}.`);
    if (b.phone) facts.push(`Customer contact phone: ${b.phone}.`);
    if (b.address?.city) facts.push(`Based in ${[b.address.city, b.address.state, b.address.country].filter(Boolean).join(", ")}.`);
    if (site?.shipping?.freeShipping) facts.push("Offers free shipping on all orders.");
    else if (site?.shipping?.freeOverCents > 0) facts.push(`Offers free shipping on orders over $${(site.shipping.freeOverCents / 100).toFixed(2)}.`);
    facts.push("Products are custom / made-to-order print-on-demand apparel and goods.");

    const client = await anthropic();
    const ask = `Write a clear, professional ${def.title} for an e-commerce store. Cover ${def.guide}.
Known facts (use them — do NOT invent specifics that aren't given; where a needed detail is missing use a [bracketed placeholder] the owner can fill in):
${facts.map((f) => "- " + f).join("\n")}
Format as plain text: a short intro paragraph, then "## " section headings with paragraphs and "- " bullet lists where helpful. Friendly but professional tone. Do NOT include a title line (it's shown separately) and do NOT add "this is not legal advice" disclaimers. Keep it specific to a print-on-demand apparel store.`;

    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 2000, thinking: { type: "adaptive" }, messages: [{ role: "user", content: ask }] });
    const body = textOf(msg).trim();
    if (!body) throw httpError(502, "Could not generate the policy — please try again.");
    return { title: def.title, body };
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

// ── Channel syndication: OAuth foundation + Google Merchant Center ────────────
// Per-org OAuth token store (encrypted) + a pluggable channel registry. Google is the first
// fully-wired channel (Content API push); the rest plug in by adding a CHANNELS entry. The
// universal product feed (storefront /feed/products.xml) already covers any channel with no OAuth.
const CHANNELS = {
    google: {
        name: "Google Merchant Center",
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scope: "https://www.googleapis.com/auth/content https://www.googleapis.com/auth/adwords",
        clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
        clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
        extraAuth: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
        wired: true,
    },
    microsoft: {
        name: "Microsoft / Bing Merchant Center",
        // Sandbox uses login.windows-ppe.net/consumers — override via env to validate against it.
        authUrl: process.env.MICROSOFT_AUTH_URL || "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: process.env.MICROSOFT_TOKEN_URL || "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scope: "https://ads.microsoft.com/msads.manage offline_access",
        clientIdEnv: "MICROSOFT_OAUTH_CLIENT_ID",
        clientSecretEnv: "MICROSOFT_OAUTH_CLIENT_SECRET",
        extraAuth: {},
        wired: true,
        needsAccountId: true, accountLabel: "Bing Merchant Center Store ID",
    },
    meta: {
        name: "Meta (Facebook & Instagram)",
        authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
        scope: "catalog_management business_management ads_read",   // ads_read → auto-pull ad spend
        clientIdEnv: "META_OAUTH_CLIENT_ID",
        clientSecretEnv: "META_OAUTH_CLIENT_SECRET",
        extraAuth: {},
        tokenStyle: "query",   // Meta exchanges the code via GET query params (not a POST form)
        longLived: true,       // swap the short-lived token for a ~60-day long-lived one
        wired: true,
        needsAccountId: true, accountLabel: "Meta Catalog ID",
    },
    pinterest: {
        name: "Pinterest",
        authUrl: "https://www.pinterest.com/oauth/",
        tokenUrl: "https://api.pinterest.com/v5/oauth/token",
        scope: "catalogs:read,catalogs:write,ads:read",   // comma-separated; ads:read → auto-pull ad spend
        clientIdEnv: "PINTEREST_OAUTH_CLIENT_ID",
        clientSecretEnv: "PINTEREST_OAUTH_CLIENT_SECRET",
        extraAuth: {},
        basicAuth: true,   // v5 token endpoint uses Basic auth (client_id:client_secret); issues refresh tokens
        wired: true,
        // catalog_id optional → uses the account's default catalog (no needsAccountId)
    },
    tiktok: {
        name: "TikTok",
        authUrl: "https://business-api.tiktok.com/portal/auth",
        tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
        clientIdEnv: "TIKTOK_APP_ID",
        clientSecretEnv: "TIKTOK_APP_SECRET",
        authStyle: "tiktok",       // app_id + redirect_uri + state (no scope/response_type)
        tokenStyle: "tiktok",      // POST JSON {app_id,secret,auth_code} → data.access_token
        headerStyle: "access-token",  // API calls use the Access-Token header, not Bearer
        noExpiry: true,            // TikTok access tokens don't expire
        wired: true,
        needsAccountId: true, accountLabel: "TikTok Catalog ID",
    },
    snapchat: {
        name: "Snapchat",
        authUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
        tokenUrl: "https://accounts.snapchat.com/login/oauth2/access_token",
        scope: "snapchat-marketing-api",
        clientIdEnv: "SNAPCHAT_OAUTH_CLIENT_ID",
        clientSecretEnv: "SNAPCHAT_OAUTH_CLIENT_SECRET",
        extraAuth: {},
        wired: true,   // standard OAuth2 — fits the foundation with no custom handling
        needsAccountId: true, accountLabel: "Snapchat Catalog ID",
    },
    reddit: {
        name: "Reddit",
        // Reddit Shopping/Dynamic Product Ads ingest a CSV/XML product feed (Reddit Ads → Catalogs).
        // Our universal feed covers it today; native Reddit Ads API push (OAuth2) is on the roadmap.
        feedOnly: true,
        feedNote: "Add your feed URL in Reddit Ads → Catalogs (Shopping / Dynamic Product Ads). Native API push is on the roadmap.",
    },
    x: {
        name: "X (Twitter)",
        // X's Ads Catalog API requires OAuth 1.0a (3-legged + per-request HMAC-SHA1 signing).
        oauth1: true,
        requestTokenUrl: "https://api.twitter.com/oauth/request_token",
        authorizeUrl: "https://api.twitter.com/oauth/authorize",
        accessTokenUrl: "https://api.twitter.com/oauth/access_token",
        clientIdEnv: "X_CONSUMER_KEY",       // X app API Key
        clientSecretEnv: "X_CONSUMER_SECRET", // X app API Secret
        wired: true,
        // Catalog is auto-discovered/created under the user's Ads account — no account id needed.
    },
};

// Per-channel AI copy guidance (Shopping-feed best practices differ subtly per channel).
const CHANNEL_GUIDE = {
    google: "Titles: Brand + Product Type + key attributes (color, size, material), front-loaded, ≤150 chars, no promo text / ALL CAPS / emojis. Descriptions: factual benefits + specs, 1-2 short paragraphs.",
    microsoft: "Bing Shopping best practices (same as Google): keyword-rich Brand + Product + attribute titles, factual benefit-led descriptions, no promotional language or emojis.",
};

// AES-256-GCM token encryption at rest. Key = CHANNEL_TOKEN_KEY (hex/base64 32 bytes) or derived
// from NEXTAUTH_SECRET. Format: "v1:<iv b64>:<tag b64>:<ct b64>".
function _tokenKey() {
    const raw = process.env.CHANNEL_TOKEN_KEY || process.env.NEXTAUTH_SECRET || "pythias-dev-channel-key";
    return crypto.createHash("sha256").update(raw).digest(); // 32 bytes
}
function encToken(plain) {
    if (!plain) return "";
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv("aes-256-gcm", _tokenKey(), iv);
    const ct = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
    return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}
function decToken(enc) {
    if (!enc || !enc.startsWith("v1:")) return enc || "";
    try {
        const [, iv, tag, ct] = enc.split(":");
        const d = crypto.createDecipheriv("aes-256-gcm", _tokenKey(), Buffer.from(iv, "base64"));
        d.setAuthTag(Buffer.from(tag, "base64"));
        return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
    } catch { return ""; }
}

// Signed OAuth state (carries orgId+channel+slug across the round-trip; HMAC-verified).
const _stateSecret = () => process.env.NEXTAUTH_SECRET || "pythias-dev-state";
export function makeChannelState(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", _stateSecret()).update(body).digest("base64url");
    return `${body}.${sig}`;
}
export function readChannelState(state) {
    if (!state || !state.includes(".")) return null;
    const [body, sig] = state.split(".");
    const expect = crypto.createHmac("sha256", _stateSecret()).update(body).digest("base64url");
    if (sig !== expect) return null;
    try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
}

// ── OAuth 1.0a (X) — request signing + 3-legged flow ─────────────────────────
const _pe = (s) => encodeURIComponent(String(s)).replace(/[!*'()]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
// Build the OAuth 1.0a Authorization header (HMAC-SHA1). bodyParams = x-www-form-urlencoded body
// params that must be folded into the signature base string (omit for JSON bodies).
function _oauth1Header(method, url, { consumerKey, consumerSecret, token, tokenSecret, extra = {}, bodyParams = {} }) {
    const oauth = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString("hex"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_version: "1.0",
        ...(token ? { oauth_token: token } : {}),
        ...extra,
    };
    const u = new URL(url);
    const all = { ...oauth, ...Object.fromEntries(u.searchParams.entries()), ...bodyParams };
    const baseParams = Object.keys(all).sort().map((k) => `${_pe(k)}=${_pe(all[k])}`).join("&");
    const baseString = [method.toUpperCase(), _pe(`${u.origin}${u.pathname}`), _pe(baseParams)].join("&");
    const signingKey = `${_pe(consumerSecret)}&${_pe(tokenSecret || "")}`;
    oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
    return "OAuth " + Object.keys(oauth).sort().map((k) => `${_pe(k)}="${_pe(oauth[k])}"`).join(", ");
}

// Async connect entry point: OAuth1 does the request-token leg here (and stashes the temp secret);
// OAuth2 just returns the authorize URL. Both return the URL to redirect the seller to.
export async function channelConnectStart(channel, { orgId, slug, premier, redirectUri }) {
    const c = CHANNELS[channel];
    if (!c) throw httpError(404, "Unknown channel");
    if (c.oauth1) {
        const consumerKey = process.env[c.clientIdEnv], consumerSecret = process.env[c.clientSecretEnv];
        if (!consumerKey) throw httpError(400, `${c.name} OAuth is not configured (set ${c.clientIdEnv}).`);
        const auth = _oauth1Header("POST", c.requestTokenUrl, { consumerKey, consumerSecret, extra: { oauth_callback: redirectUri } });
        const r = await fetch(c.requestTokenUrl, { method: "POST", headers: { Authorization: auth } });
        const text = await r.text();
        if (!r.ok) throw httpError(400, `X request-token failed: ${text.slice(0, 160)}`);
        const p = new URLSearchParams(text);
        const reqToken = p.get("oauth_token"), reqSecret = p.get("oauth_token_secret");
        if (!reqToken) throw httpError(400, "X request token missing");
        await StorefrontChannelConnection.findOneAndUpdate({ orgId, channel },
            { $set: { status: "pending", oauth1RequestToken: reqToken, oauth1RequestSecret: encToken(reqSecret), connectSlug: slug || "", connectPremier: !!premier }, $setOnInsert: { orgId, channel } }, { upsert: true });
        return `${c.authorizeUrl}?oauth_token=${encodeURIComponent(reqToken)}`;
    }
    return channelAuthorizeUrl(channel, { orgId, slug, premier, redirectUri });
}

// OAuth1 callback: exchange the verifier for the permanent access token + secret.
export async function finishOAuth1(channel, { oauthToken, verifier }) {
    const c = CHANNELS[channel];
    if (!c?.oauth1) throw httpError(400, "Not an OAuth1 channel");
    const conn = await StorefrontChannelConnection.findOne({ channel, oauth1RequestToken: oauthToken });
    if (!conn) throw httpError(400, "No pending connection for this token");
    const consumerKey = process.env[c.clientIdEnv], consumerSecret = process.env[c.clientSecretEnv];
    const auth = _oauth1Header("POST", c.accessTokenUrl, { consumerKey, consumerSecret, token: oauthToken, tokenSecret: decToken(conn.oauth1RequestSecret), extra: { oauth_verifier: verifier } });
    const r = await fetch(c.accessTokenUrl, { method: "POST", headers: { Authorization: auth } });
    const text = await r.text();
    if (!r.ok) throw httpError(400, `X access-token failed: ${text.slice(0, 160)}`);
    const p = new URLSearchParams(text);
    const at = p.get("oauth_token"), ats = p.get("oauth_token_secret");
    if (!at || !ats) throw httpError(400, "X access token missing");
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { status: "connected", accessToken: encToken(at), oauth1TokenSecret: encToken(ats), oauth1RequestToken: "", oauth1RequestSecret: "" } });
    return { ok: true, slug: conn.connectSlug, premier: conn.connectPremier };
}

// Build the OAuth authorize URL (handles PKCE — the verifier rides inside the signed state).
export function channelAuthorizeUrl(channel, { orgId, slug, premier, redirectUri }) {
    const c = CHANNELS[channel];
    if (!c) throw httpError(404, "Unknown channel");
    const clientId = process.env[c.clientIdEnv];
    if (!clientId) throw httpError(400, `${c.name} OAuth is not configured (set ${c.clientIdEnv}).`);
    const payload = { orgId: String(orgId), channel, ...(slug ? { slug } : {}), ...(premier ? { premier: true } : {}) };
    const extra = { ...(c.extraAuth || {}) };
    if (c.pkce) {
        const verifier = crypto.randomBytes(32).toString("base64url");
        payload.v = verifier;
        extra.code_challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
        extra.code_challenge_method = "S256";
    }
    const state = makeChannelState(payload);
    if (c.authStyle === "tiktok") return `${c.authUrl}?${new URLSearchParams({ app_id: clientId, redirect_uri: redirectUri, state }).toString()}`;
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: c.scope, state, ...extra });
    return `${c.authUrl}?${params.toString()}`;
}

async function _googleMerchantId(accessToken) {
    const r = await fetch("https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
    const j = await r.json().catch(() => ({}));
    const id = j.accountIdentifiers?.[0];
    return id?.merchantId || id?.aggregatorId || "";
}

export async function exchangeAndSaveChannel(orgId, channel, code, redirectUri, { connectedBy = "", codeVerifier } = {}) {
    const c = CHANNELS[channel];
    if (!c) throw httpError(404, "Unknown channel");
    const clientId = process.env[c.clientIdEnv], clientSecret = process.env[c.clientSecretEnv];
    let tok;
    if (c.tokenStyle === "tiktok") {
        // TikTok: POST JSON {app_id, secret, auth_code}; access token in data.access_token; no expiry.
        const r = await fetch(c.tokenUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ app_id: clientId, secret: clientSecret, auth_code: code, grant_type: "authorization_code" }) });
        const j = await r.json().catch(() => ({}));
        const at = j.data?.access_token;
        if (!at) throw httpError(400, j.message || "Token exchange failed");
        tok = { access_token: at, expires_in: 315360000 };   // ~10y (TikTok tokens don't expire)
    } else if (c.tokenStyle === "query") {
        // Meta: code → token via GET query params, then short-lived → long-lived (~60 days).
        const u = new URL(c.tokenUrl);
        u.search = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code }).toString();
        const r = await fetch(u, { method: "GET" });
        tok = await r.json().catch(() => ({}));
        if (!r.ok || !tok.access_token) throw httpError(400, tok.error?.message || "Token exchange failed");
        if (c.longLived) {
            try {
                const lu = new URL(c.tokenUrl);
                lu.search = new URLSearchParams({ grant_type: "fb_exchange_token", client_id: clientId, client_secret: clientSecret, fb_exchange_token: tok.access_token }).toString();
                const lr = await fetch(lu); const lj = await lr.json().catch(() => ({}));
                if (lr.ok && lj.access_token) tok = lj;
            } catch { /* keep short-lived */ }
        }
    } else {
        const body = { code, redirect_uri: redirectUri, grant_type: "authorization_code", client_id: clientId };
        if (c.pkce && codeVerifier) body.code_verifier = codeVerifier;
        const headers = { "Content-Type": "application/x-www-form-urlencoded" };
        if (c.basicAuth) headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
        else body.client_secret = clientSecret;
        const r = await fetch(c.tokenUrl, { method: "POST", headers, body: new URLSearchParams(body) });
        tok = await r.json().catch(() => ({}));
        if (!r.ok || !tok.access_token) throw httpError(400, tok.error_description || tok.error?.message || tok.error || "Token exchange failed");
    }
    let accountId = "";
    if (channel === "google") { try { accountId = await _googleMerchantId(tok.access_token); } catch { /* set later */ } }
    await StorefrontChannelConnection.findOneAndUpdate(
        { orgId, channel },
        { $set: {
            status: "connected", accessToken: encToken(tok.access_token),
            ...(tok.refresh_token ? { refreshToken: encToken(tok.refresh_token) } : {}),
            expiresAt: new Date(Date.now() + (tok.expires_in || 3600) * 1000),
            scope: tok.scope || c.scope, accountId, connectedBy,
        }, $setOnInsert: { orgId, channel } },
        { upsert: true }
    );
    return { ok: true, accountId };
}

// Return a valid access token, refreshing if expired.
async function _validToken(conn) {
    const c = CHANNELS[conn.channel];
    if (conn.expiresAt && conn.expiresAt.getTime() > Date.now() + 60000) return decToken(conn.accessToken);
    const refresh = decToken(conn.refreshToken);
    if (!refresh) return decToken(conn.accessToken);   // no refresh token; hope it's still valid
    const body = { refresh_token: refresh, grant_type: "refresh_token", client_id: process.env[c.clientIdEnv] };
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (c.basicAuth) headers.Authorization = `Basic ${Buffer.from(`${process.env[c.clientIdEnv]}:${process.env[c.clientSecretEnv]}`).toString("base64")}`;
    else body.client_secret = process.env[c.clientSecretEnv];
    const r = await fetch(c.tokenUrl, { method: "POST", headers, body: new URLSearchParams(body) });
    const tok = await r.json().catch(() => ({}));
    if (!r.ok || !tok.access_token) throw httpError(400, "Token refresh failed — reconnect the channel.");
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { accessToken: encToken(tok.access_token), expiresAt: new Date(Date.now() + (tok.expires_in || 3600) * 1000) } });
    return tok.access_token;
}

function _storeBaseUrl(site) {
    if (site?.customDomain?.hostname) return `https://${site.customDomain.hostname}`;
    const base = process.env.STOREFRONT_BASE_DOMAIN || "pythias.store";
    return `https://${site?.subdomain || "store"}.${base}`;
}

export async function listChannels(orgId) {
    const [conns, site] = await Promise.all([
        StorefrontChannelConnection.find({ orgId }).lean(),
        StorefrontSite.findOne({ orgId }).select("subdomain customDomain").lean(),
    ]);
    const byCh = new Map(conns.map((c) => [c.channel, c]));
    const channels = Object.entries(CHANNELS).map(([key, c]) => {
        const conn = byCh.get(key);
        return {
            channel: key, name: c.name, wired: !!c.wired,
            feedOnly: !!c.feedOnly, feedNote: c.feedNote || null,
            configured: c.clientIdEnv ? !!process.env[c.clientIdEnv] : false,
            needsAccountId: !!c.needsAccountId, accountLabel: c.accountLabel || null,
            connected: conn?.status === "connected",
            accountId: conn?.accountId || null,
            adsCustomerId: conn?.adsCustomerId || null,
            adsAuto: (key === "google" && !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) || key === "meta"
                || (key === "microsoft" && !!process.env.MICROSOFT_ADS_DEVELOPER_TOKEN && !!process.env.MICROSOFT_ADS_CUSTOMER_ID)
                || ["pinterest", "tiktok", "snapchat"].includes(key),
            adsLabel: { meta: "Meta Ad Account ID", microsoft: "Microsoft Ads Account ID", pinterest: "Pinterest Ad Account ID", tiktok: "TikTok Advertiser ID", snapchat: "Snapchat Ad Account ID" }[key] || "Google Ads Customer ID",
            lastSyncAt: conn?.lastSyncAt || null,
            lastSyncResult: conn?.lastSyncResult || null,
        };
    });
    return { channels, feedUrl: site ? `${_storeBaseUrl(site)}/feed/products.xml` : null };
}

export async function disconnectChannel(orgId, channel) {
    await StorefrontChannelConnection.deleteOne({ orgId, channel });
    return { ok: true };
}

// Build Content-API product resources from the catalog (Google + Bing share this shape), applying
// any per-channel AI-optimized title/description overrides.
async function _channelProductResources(orgId, channel) {
    const [site, products, listings] = await Promise.all([
        StorefrontSite.findOne({ orgId }).select("subdomain customDomain name businessInfo").lean(),
        PlatformProduct.find({ orgId, active: { $ne: false } }).populate("variantsArray.color", "name").select("title description brand productImages variantsArray category").limit(2000).lean(),
        StorefrontChannelListing.find({ orgId, channel }).select("productId title description").lean(),
    ]);
    const lmap = new Map(listings.map((l) => [String(l.productId), l]));
    const baseUrl = _storeBaseUrl(site);
    const brandDefault = site?.businessInfo?.legalName || site?.name || "Store";
    const out = [];
    for (const p of products) {
        const ov = lmap.get(String(p._id));
        const title0 = ov?.title || p.title;
        const desc0 = ov?.description || p.description || p.title || "";
        const fallbackImg = p.productImages?.find((i) => i.image)?.image;
        for (const v of p.variantsArray ?? []) {
            if (!v.sku || !(v.price > 0)) continue;
            const color = v.color?.name || v.ids?.colorName || "";
            const size = v.ids?.sizeName || (typeof v.size === "string" ? v.size : "");
            const img = v.image || fallbackImg;
            out.push({
                offerId: v.sku, title: [title0, color, size].filter(Boolean).join(" - ").slice(0, 150),
                description: String(desc0).slice(0, 5000),
                link: `${baseUrl}/products/${p._id}`,
                imageLink: img ? (img.startsWith("http") ? img : `${baseUrl}${img}`) : undefined,
                contentLanguage: "en", targetCountry: "US", channel: "online",
                availability: "in stock", condition: "new",
                price: { value: v.price.toFixed(2), currency: "USD" },
                brand: p.brand || brandDefault,
                itemGroupId: String(p._id),
                ...(v.gtin || v.upc ? { gtin: String(v.gtin || v.upc) } : { identifierExists: false }),
                ...(color ? { color } : {}), ...(size ? { sizes: [size] } : {}),
                ...(p.category?.[0] ? { productTypes: [String(p.category[0])] } : {}),
            });
        }
    }
    return out;
}

async function _runBatchSync(conn, url, headers, products, merchantId) {
    if (!products.length) { await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: { synced: 0, failed: 0 } } }); return { synced: 0, failed: 0 }; }
    let synced = 0, failed = 0; const errors = [];
    for (let i = 0; i < products.length; i += 100) {
        const chunk = products.slice(i, i + 100).map((product, j) => ({ batchId: i + j + 1, merchantId, method: "insert", product }));
        const r = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ entries: chunk }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { failed += chunk.length; if (errors.length < 5) errors.push(j.error?.message || `HTTP ${r.status}`); continue; }
        for (const e of j.entries || []) { if (e.errors) { failed++; if (errors.length < 5) errors.push(e.errors.errors?.[0]?.message || "error"); } else synced++; }
    }
    const result = { synced, failed, ...(errors.length ? { error: errors[0] } : {}) };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// Push the catalog to Google Merchant Center (Content API custombatch).
export async function googleSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "google" });
    if (!conn) throw httpError(400, "Google is not connected.");
    const token = await _validToken(conn);
    let merchantId = conn.accountId;
    if (!merchantId) { merchantId = await _googleMerchantId(token); if (merchantId) await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { accountId: merchantId } }); }
    if (!merchantId) throw httpError(400, "No Merchant Center account found for this Google login.");
    const products = await _channelProductResources(orgId, "google");
    return _runBatchSync(conn, "https://shoppingcontent.googleapis.com/content/v2.1/products/batch", { Authorization: `Bearer ${token}` }, products, merchantId);
}

// Push the catalog to Microsoft/Bing Merchant Center (Content API — same shape, Microsoft auth headers).
export async function microsoftSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "microsoft" });
    if (!conn) throw httpError(400, "Microsoft is not connected.");
    const storeId = conn.accountId;
    if (!storeId) throw httpError(400, "Set your Bing Merchant Center Store ID first.");
    const devToken = process.env.MICROSOFT_ADS_DEVELOPER_TOKEN;
    if (!devToken) throw httpError(400, "MICROSOFT_ADS_DEVELOPER_TOKEN is not configured.");
    const token = await _validToken(conn);
    const products = await _channelProductResources(orgId, "microsoft");
    const contentBase = process.env.MICROSOFT_CONTENT_BASE || "https://content.api.bingads.microsoft.com";
    return _runBatchSync(conn, `${contentBase}/shopping/v9.1/bmc/${storeId}/products/batch`, { AuthenticationToken: token, DeveloperToken: devToken }, products, storeId);
}

// Push the catalog to a Meta (Facebook/Instagram) product catalog via the Graph API items_batch.
export async function metaSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "meta" });
    if (!conn) throw httpError(400, "Meta is not connected.");
    const catalogId = conn.accountId;
    if (!catalogId) throw httpError(400, "Set your Meta Catalog ID first.");
    const token = await _validToken(conn);
    const products = await _channelProductResources(orgId, "meta");
    if (!products.length) { await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: { synced: 0, failed: 0 } } }); return { synced: 0, failed: 0 }; }
    let synced = 0, failed = 0; const errors = [];
    for (let i = 0; i < products.length; i += 100) {
        const requests = products.slice(i, i + 100).map((p) => ({
            method: "UPDATE", retailer_id: p.offerId,
            data: {
                name: p.title, description: p.description, availability: "in stock", condition: "new",
                price: Math.round(parseFloat(p.price.value) * 100), currency: p.price.currency,
                url: p.link, ...(p.imageLink ? { image_url: p.imageLink } : {}), brand: p.brand,
                ...(p.color ? { color: p.color } : {}), ...(p.sizes?.[0] ? { size: p.sizes[0] } : {}),
            },
        }));
        const r = await fetch(`https://graph.facebook.com/v21.0/${catalogId}/items_batch`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: token, item_type: "PRODUCT_ITEM", requests }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { failed += requests.length; if (errors.length < 5) errors.push(j.error?.message || `HTTP ${r.status}`); continue; }
        synced += requests.length;   // items_batch is async (returns handles) — count submitted
    }
    const result = { synced, failed, async: true, ...(errors.length ? { error: errors[0] } : {}) };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// Push the catalog to Pinterest via the v5 catalogs items batch (UPSERT). Uses the account's
// default catalog (or conn.accountId if the seller set a specific catalog id).
export async function pinterestSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "pinterest" });
    if (!conn) throw httpError(400, "Pinterest is not connected.");
    const token = await _validToken(conn);
    const products = await _channelProductResources(orgId, "pinterest");
    if (!products.length) { await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: { synced: 0, failed: 0 } } }); return { synced: 0, failed: 0 }; }
    let synced = 0, failed = 0; const errors = [];
    for (let i = 0; i < products.length; i += 100) {
        const items = products.slice(i, i + 100).map((p) => ({
            item_id: p.offerId,
            attributes: {
                title: p.title, description: p.description, link: p.link,
                ...(p.imageLink ? { image_link: p.imageLink } : {}),
                availability: "in stock", condition: "new",
                price: `${p.price.value} ${p.price.currency}`,
                ...(p.brand ? { brand: p.brand } : {}), ...(p.color ? { color: p.color } : {}), ...(p.sizes?.[0] ? { size: p.sizes[0] } : {}),
            },
        }));
        const r = await fetch("https://api.pinterest.com/v5/catalogs/items/batch", {
            method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ country: "US", language: "EN", operation: "UPSERT", items, ...(conn.accountId ? { catalog_id: conn.accountId } : {}) }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { failed += items.length; if (errors.length < 5) errors.push(j.message || j.error?.message || `HTTP ${r.status}`); continue; }
        synced += items.length;   // async (returns batch_id) — count submitted
    }
    const result = { synced, failed, async: true, ...(errors.length ? { error: errors[0] } : {}) };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// Push the catalog to Snapchat via the Marketing API catalog products endpoint.
export async function snapchatSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "snapchat" });
    if (!conn) throw httpError(400, "Snapchat is not connected.");
    const catalogId = conn.accountId;
    if (!catalogId) throw httpError(400, "Set your Snapchat Catalog ID first.");
    const token = await _validToken(conn);
    const products = await _channelProductResources(orgId, "snapchat");
    if (!products.length) { await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: { synced: 0, failed: 0 } } }); return { synced: 0, failed: 0 }; }
    let synced = 0, failed = 0; const errors = [];
    for (let i = 0; i < products.length; i += 100) {
        const batch = products.slice(i, i + 100).map((p) => ({
            id: p.offerId, title: p.title, description: p.description, link: p.link,
            ...(p.imageLink ? { image_link: p.imageLink } : {}),
            availability: "in stock", condition: "new",
            price: `${p.price.value} ${p.price.currency}`,
            ...(p.brand ? { brand: p.brand } : {}), ...(p.color ? { color: p.color } : {}), ...(p.sizes?.[0] ? { size: p.sizes[0] } : {}),
        }));
        const r = await fetch(`https://adsapi.snapchat.com/v1/catalogs/${catalogId}/products`, {
            method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ products: batch }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { failed += batch.length; if (errors.length < 5) errors.push(j.error_description || j.message || `HTTP ${r.status}`); continue; }
        synced += batch.length;
    }
    const result = { synced, failed, async: true, ...(errors.length ? { error: errors[0] } : {}) };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// Push the catalog to X via the Ads Catalog API (OAuth 1.0a signed). Auto-finds/creates the user's
// product catalog, then batch-upserts products. ⚠️ Catalog product shape modeled on docs — validate live.
export async function xSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "x" });
    if (!conn || conn.status !== "connected") throw httpError(400, "X is not connected.");
    const c = CHANNELS.x;
    const consumerKey = process.env[c.clientIdEnv], consumerSecret = process.env[c.clientSecretEnv];
    const token = decToken(conn.accessToken), tokenSecret = decToken(conn.oauth1TokenSecret);
    const sign = (method, url, bodyParams) => _oauth1Header(method, url, { consumerKey, consumerSecret, token, tokenSecret, bodyParams });

    let catalogId = conn.accountId;
    if (!catalogId) {
        const listUrl = "https://ads-api.x.com/12/product_catalogs";
        const lr = await fetch(listUrl, { headers: { Authorization: sign("GET", listUrl) } });
        const lj = await lr.json().catch(() => ({}));
        catalogId = lj.data?.[0]?.id;
        if (!catalogId) {
            const site = await StorefrontSite.findOne({ orgId }).select("name").lean();
            const body = { name: String(site?.name || "Pythias Store").slice(0, 60), currency: "USD" };
            const cr = await fetch(listUrl, { method: "POST", headers: { Authorization: sign("POST", listUrl, body), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
            const cj = await cr.json().catch(() => ({}));
            catalogId = cj.data?.id;
            if (!catalogId) throw httpError(400, `X catalog create failed: ${cj.errors?.[0]?.message || `HTTP ${cr.status}`}`);
        }
        await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { accountId: catalogId } });
    }

    const products = await _channelProductResources(orgId, "x");
    if (!products.length) { await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: { synced: 0, failed: 0 } } }); return { synced: 0, failed: 0 }; }
    const url = `https://ads-api.x.com/12/product_catalogs/${catalogId}/products`;
    let synced = 0, failed = 0; const errors = [];
    for (let i = 0; i < products.length; i += 100) {
        const items = products.slice(i, i + 100).map((p) => ({
            product_id: p.offerId, title: p.title, description: p.description, link: p.link,
            ...(p.imageLink ? { image_link: p.imageLink } : {}), availability: "in stock", condition: "new",
            price: `${p.price.value} ${p.price.currency}`, ...(p.brand ? { brand: p.brand } : {}),
        }));
        const r = await fetch(url, { method: "POST", headers: { Authorization: sign("POST", url), "Content-Type": "application/json" }, body: JSON.stringify({ products: items }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { failed += items.length; if (errors.length < 5) errors.push(j.errors?.[0]?.message || `HTTP ${r.status}`); continue; }
        synced += items.length;
    }
    const result = { synced, failed, async: true, ...(errors.length ? { error: errors[0] } : {}) };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// TikTok authorizes API calls with an Access-Token header (not Bearer).
const _apiAuthHeader = (channel, token) => (CHANNELS[channel]?.headerStyle === "access-token" ? { "Access-Token": token } : { Authorization: `Bearer ${token}` });

// Push the catalog to TikTok via the catalog product upload (file-URL method — TikTok ingests our
// universal feed). Needs the seller's TikTok Catalog ID + the platform's Business Center id.
export async function tiktokSyncProducts(orgId) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "tiktok" });
    if (!conn) throw httpError(400, "TikTok is not connected.");
    const catalogId = conn.accountId;
    if (!catalogId) throw httpError(400, "Set your TikTok Catalog ID first.");
    const bcId = process.env.TIKTOK_BC_ID;
    if (!bcId) throw httpError(400, "TIKTOK_BC_ID is not configured.");
    const token = await _validToken(conn);
    const site = await StorefrontSite.findOne({ orgId }).select("subdomain customDomain").lean();
    const feedUrl = `${_storeBaseUrl(site)}/feed/products.xml`;
    const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/catalog/product/upload/", {
        method: "POST", headers: { ..._apiAuthHeader("tiktok", token), "Content-Type": "application/json" },
        body: JSON.stringify({ bc_id: bcId, catalog_id: catalogId, file_url: feedUrl }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (j.code && j.code !== 0)) throw httpError(400, j.message || `TikTok upload failed (HTTP ${r.status})`);
    const result = { synced: 0, note: "Feed submitted to TikTok for processing.", async: true };
    await StorefrontChannelConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastSyncResult: result } });
    return result;
}

// Seller sets the channel account/store id (Bing needs it; can't be auto-discovered like Google).
export async function setChannelAccount(orgId, channel, accountId) {
    await StorefrontChannelConnection.updateOne({ orgId, channel }, { $set: { accountId: String(accountId || "").trim() } });
    return { ok: true };
}

// AI-optimize product titles/descriptions for a specific channel's best practices.
export async function optimizeChannelListings(orgId, channel, { limit = 40 } = {}) {
    if (!CHANNELS[channel]) throw httpError(404, "Unknown channel");
    const products = await PlatformProduct.find({ orgId, active: { $ne: false } }).select("title description brand category").limit(limit).lean();
    if (!products.length) return { optimized: 0 };
    const client = await anthropic();
    const list = products.map((p) => ({ id: String(p._id), title: p.title, description: String(p.description || "").slice(0, 400), brand: p.brand || "" }));
    const prompt = `Rewrite these product listings optimized for ${CHANNELS[channel].name}. ${CHANNEL_GUIDE[channel] || CHANNEL_GUIDE.google}\nKeep each title's product identity; improve, don't fabricate specs. Return STRICT JSON only: {"items":[{"id":"<id>","title":"...","description":"..."}]}.\n\nPRODUCTS:\n${JSON.stringify(list)}`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 4000, thinking: { type: "adaptive" }, messages: [{ role: "user", content: prompt }] });
    const out = parseJson(textOf(msg));
    let n = 0;
    for (const it of out.items || []) {
        if (!it.id) continue;
        await StorefrontChannelListing.updateOne({ orgId, channel, productId: it.id }, { $set: { title: String(it.title || "").slice(0, 150), description: String(it.description || "").slice(0, 5000) } }, { upsert: true }).catch(() => {});
        n++;
    }
    return { optimized: n };
}

// ── Closed-loop channel ROI (ad spend → revenue → true profit) ────────────────
const _SOURCE_CHANNEL = { google: "google", bing: "microsoft", microsoft: "microsoft", facebook: "meta", instagram: "meta", meta: "meta", fb: "meta", ig: "meta", pinterest: "pinterest", tiktok: "tiktok" };
export async function recordAdSpend(orgId, { channel, amountCents, date } = {}) {
    if (!channel || !(Number(amountCents) >= 0)) throw httpError(400, "channel and amount required");
    await StorefrontAdSpend.create({ orgId, channel, date: date || _iso(new Date()), amountCents: Math.round(Number(amountCents)) });
    return { ok: true };
}
export async function setChannelAdsAccount(orgId, channel, adsCustomerId) {
    await StorefrontChannelConnection.updateOne({ orgId, channel }, { $set: { adsCustomerId: String(adsCustomerId || "").replace(/[^\d-]/g, "") } });
    return { ok: true };
}

// Auto-pull daily ad spend from the Google Ads API (GAQL) → StorefrontAdSpend (source google_ads,
// idempotent per day). Uses the broadened Google OAuth token (adwords scope) + developer token.
export async function syncGoogleAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "google" });
    if (!conn) throw httpError(400, "Google is not connected.");
    const customerId = String(conn.adsCustomerId || "").replace(/\D/g, "");
    if (!customerId) throw httpError(400, "Set your Google Ads Customer ID first.");
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) throw httpError(400, "GOOGLE_ADS_DEVELOPER_TOKEN is not configured.");
    const token = await _validToken(conn);
    const query = `SELECT segments.date, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '${_daysAgo(days)}' AND '${_iso(new Date())}'`;
    const headers = {
        Authorization: `Bearer ${token}`, "developer-token": devToken, "Content-Type": "application/json",
        ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ? { "login-customer-id": String(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).replace(/\D/g, "") } : {}),
    };
    const byDate = {};
    let pageToken;
    do {
        const r = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`, { method: "POST", headers, body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw httpError(400, j.error?.message || (Array.isArray(j) && j[0]?.error?.message) || `Google Ads error HTTP ${r.status} — reconnect Google if you connected before ad-spend sync existed.`);
        for (const row of j.results || []) { const d = row.segments?.date; if (d) byDate[d] = (byDate[d] || 0) + Number(row.metrics?.costMicros || 0); }
        pageToken = j.nextPageToken;
    } while (pageToken);

    let dates = 0, totalCents = 0;
    for (const [date, micros] of Object.entries(byDate)) {
        const cents = Math.round((micros / 1e6) * 100);
        await StorefrontAdSpend.updateOne({ orgId, channel: "google", date, source: "google_ads" }, { $set: { amountCents: cents } }, { upsert: true });
        dates++; totalCents += cents;
    }
    return { dates, totalCents };
}

// Auto-pull daily Meta ad spend via the Marketing API Insights (REST). Uses the Meta OAuth token
// (needs the ads_read scope) + the seller's Ad Account ID. Upserts source meta_ads, idempotent.
export async function syncMetaAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "meta" });
    if (!conn) throw httpError(400, "Meta is not connected.");
    let acct = String(conn.adsCustomerId || "").trim();
    if (!acct) throw httpError(400, "Set your Meta Ad Account ID first.");
    if (!acct.startsWith("act_")) acct = `act_${acct.replace(/\D/g, "")}`;
    const token = await _validToken(conn);
    const first = new URL(`https://graph.facebook.com/v21.0/${acct}/insights`);
    first.search = new URLSearchParams({ fields: "spend", level: "account", time_increment: "1", time_range: JSON.stringify({ since: _daysAgo(days), until: _iso(new Date()) }), access_token: token, limit: "500" }).toString();
    let next = first.toString(), dates = 0, totalCents = 0;
    while (next) {
        const r = await fetch(next);
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw httpError(400, j.error?.message || "Meta insights failed — reconnect Meta to grant the ads_read permission.");
        for (const row of j.data || []) {
            const date = row.date_start; if (!date) continue;
            const cents = Math.round(parseFloat(row.spend || "0") * 100);
            await StorefrontAdSpend.updateOne({ orgId, channel: "meta", date, source: "meta_ads" }, { $set: { amountCents: cents } }, { upsert: true });
            dates++; totalCents += cents;
        }
        next = j.paging?.next || null;
    }
    return { dates, totalCents };
}

// Minimal single-entry ZIP extractor (Microsoft reports download as a ZIP'd CSV). Built-in zlib only.
function _unzipSingleCsv(buf) {
    if (buf.length < 30 || buf.readUInt32LE(0) !== 0x04034b50) return buf.toString("utf8");  // not a zip → assume raw CSV
    const method = buf.readUInt16LE(8), compSize = buf.readUInt32LE(18);
    const dataStart = 30 + buf.readUInt16LE(26) + buf.readUInt16LE(28);
    const end = compSize > 0 ? dataStart + compSize : buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));  // central dir sig if size streamed
    const data = buf.subarray(dataStart, end > dataStart ? end : undefined);
    return method === 0 ? data.toString("utf8") : zlib.inflateRawSync(data).toString("utf8");
}
const _sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const _soapFault = (xml) => { const m = xml.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/) || xml.match(/<Message>([^<]+)<\/Message>/); return m ? `: ${m[1]}` : ""; };

// Auto-pull Bing ad spend via the Microsoft Advertising Reporting API v13 (async SOAP: submit →
// poll → download ZIP'd CSV). Needs the seller's Ads Account ID + platform DeveloperToken/CustomerId.
// ⚠️ Hand-rolled SOAP/ZIP — validate against a live account before relying on it.
export async function syncMicrosoftAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "microsoft" });
    if (!conn) throw httpError(400, "Microsoft is not connected.");
    const accountId = String(conn.adsCustomerId || "").replace(/\D/g, "");
    if (!accountId) throw httpError(400, "Set your Microsoft Ads Account ID first.");
    const devToken = process.env.MICROSOFT_ADS_DEVELOPER_TOKEN, customerId = process.env.MICROSOFT_ADS_CUSTOMER_ID;
    if (!devToken || !customerId) throw httpError(400, "MICROSOFT_ADS_DEVELOPER_TOKEN / MICROSOFT_ADS_CUSTOMER_ID not configured.");
    const token = await _validToken(conn);

    const URL_ = process.env.MICROSOFT_REPORTING_URL || "https://reporting.api.bingads.microsoft.com/Api/Advertiser/Reporting/v13/ReportingService.svc";
    const NS = "https://bingads.microsoft.com/Reporting/v13";
    const hdr = (action) => `<s:Header xmlns="${NS}"><Action mustUnderstand="1">${action}</Action><AuthenticationToken>${token}</AuthenticationToken><DeveloperToken>${devToken}</DeveloperToken><CustomerId>${customerId}</CustomerId><CustomerAccountId>${accountId}</CustomerAccountId></s:Header>`;
    const env = (action, body) => `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">${hdr(action)}<s:Body>${body}</s:Body></s:Envelope>`;
    const post = (action, body) => fetch(URL_, { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: action }, body: env(action, body) }).then((r) => r.text());
    const dpart = (d) => `<Day>${d.getUTCDate()}</Day><Month>${d.getUTCMonth() + 1}</Month><Year>${d.getUTCFullYear()}</Year>`;
    const start = new Date(Date.now() - days * 86400000), endDate = new Date();

    const submitXml = await post("SubmitGenerateReport",
        `<SubmitGenerateReportRequest xmlns="${NS}"><ReportRequest i:type="AccountPerformanceReportRequest"><ExcludeColumnHeaders>false</ExcludeColumnHeaders><ExcludeReportFooter>true</ExcludeReportFooter><ExcludeReportHeader>true</ExcludeReportHeader><Format>Csv</Format><ReturnOnlyCompleteData>false</ReturnOnlyCompleteData><Aggregation>Daily</Aggregation><Columns><AccountPerformanceReportColumn>TimePeriod</AccountPerformanceReportColumn><AccountPerformanceReportColumn>Spend</AccountPerformanceReportColumn></Columns><Scope><AccountIds xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"><a:long>${accountId}</a:long></AccountIds></Scope><Time><CustomDateRangeStart>${dpart(start)}</CustomDateRangeStart><CustomDateRangeEnd>${dpart(endDate)}</CustomDateRangeEnd></Time></ReportRequest></SubmitGenerateReportRequest>`);
    const reqId = (submitXml.match(/<ReportRequestId[^>]*>([^<]+)<\/ReportRequestId>/) || [])[1];
    if (!reqId) throw httpError(400, `Microsoft report submit failed${_soapFault(submitXml)}`);

    let downloadUrl = null;
    for (let i = 0; i < 20; i++) {
        await _sleep(3000);
        const pollXml = await post("PollGenerateReport", `<PollGenerateReportRequest xmlns="${NS}"><ReportRequestId>${reqId}</ReportRequestId></PollGenerateReportRequest>`);
        const status = (pollXml.match(/<Status>([^<]+)<\/Status>/) || [])[1];
        if (status === "Success") { downloadUrl = (pollXml.match(/<ReportDownloadUrl>([^<]+)<\/ReportDownloadUrl>/) || [])[1]; break; }
        if (status === "Error") throw httpError(400, `Microsoft report failed${_soapFault(pollXml)}`);
    }
    if (!downloadUrl) throw httpError(400, "Microsoft report timed out — try again shortly.");

    const zr = await fetch(downloadUrl.replace(/&amp;/g, "&"));
    const csv = _unzipSingleCsv(Buffer.from(await zr.arrayBuffer()));
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    const header = (lines.shift() || "").split(",").map((s) => s.replace(/"/g, "").trim());
    const di = header.indexOf("TimePeriod"), si = header.indexOf("Spend");
    if (di < 0 || si < 0) throw httpError(400, "Unexpected Microsoft report format.");
    let dates = 0, totalCents = 0;
    for (const ln of lines) {
        const cols = ln.split(",");
        const date = (cols[di] || "").replace(/"/g, "").trim();
        if (!/^\d{4}-\d{2}-\d{2}/.test(date)) continue;
        const cents = Math.round((parseFloat((cols[si] || "0").replace(/["$,]/g, "")) || 0) * 100);
        await StorefrontAdSpend.updateOne({ orgId, channel: "microsoft", date: date.slice(0, 10), source: "microsoft_ads" }, { $set: { amountCents: cents } }, { upsert: true });
        dates++; totalCents += cents;
    }
    return { dates, totalCents };
}

// Auto-pull Pinterest ad spend via the v5 ad-account Analytics (needs ads:read scope + Ad Account ID).
export async function syncPinterestAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "pinterest" });
    if (!conn) throw httpError(400, "Pinterest is not connected.");
    const adAccountId = String(conn.adsCustomerId || "").trim();
    if (!adAccountId) throw httpError(400, "Set your Pinterest Ad Account ID first.");
    const token = await _validToken(conn);
    const u = new URL(`https://api.pinterest.com/v5/ad_accounts/${adAccountId}/analytics`);
    u.search = new URLSearchParams({ start_date: _daysAgo(days), end_date: _iso(new Date()), granularity: "DAY", columns: "SPEND_IN_DOLLAR" }).toString();
    const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw httpError(400, j.message || "Pinterest analytics failed — reconnect Pinterest to grant the ads:read scope.");
    let dates = 0, totalCents = 0;
    for (const row of (Array.isArray(j) ? j : j.data || [])) {
        const date = String(row.DATE || row.date || "").slice(0, 10); if (!date) continue;
        const cents = Math.round((Number(row.SPEND_IN_DOLLAR) || 0) * 100);
        await StorefrontAdSpend.updateOne({ orgId, channel: "pinterest", date, source: "pinterest_ads" }, { $set: { amountCents: cents } }, { upsert: true });
        dates++; totalCents += cents;
    }
    return { dates, totalCents };
}

// Auto-pull TikTok ad spend via the integrated report (needs Advertiser ID; Access-Token header).
export async function syncTiktokAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "tiktok" });
    if (!conn) throw httpError(400, "TikTok is not connected.");
    const advertiserId = String(conn.adsCustomerId || "").replace(/\D/g, "");
    if (!advertiserId) throw httpError(400, "Set your TikTok Advertiser ID first.");
    const token = await _validToken(conn);
    const u = new URL("https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/");
    u.search = new URLSearchParams({ advertiser_id: advertiserId, report_type: "BASIC", data_level: "AUCTION_ADVERTISER", dimensions: JSON.stringify(["stat_time_day"]), metrics: JSON.stringify(["spend"]), start_date: _daysAgo(days), end_date: _iso(new Date()), page_size: "1000" }).toString();
    const r = await fetch(u, { headers: { ..._apiAuthHeader("tiktok", token) } });
    const j = await r.json().catch(() => ({}));
    if (j.code && j.code !== 0) throw httpError(400, j.message || "TikTok report failed");
    let dates = 0, totalCents = 0;
    for (const row of j.data?.list || []) {
        const date = String(row.dimensions?.stat_time_day || "").slice(0, 10); if (!date) continue;
        const cents = Math.round((parseFloat(row.metrics?.spend || "0") || 0) * 100);
        await StorefrontAdSpend.updateOne({ orgId, channel: "tiktok", date, source: "tiktok_ads" }, { $set: { amountCents: cents } }, { upsert: true });
        dates++; totalCents += cents;
    }
    return { dates, totalCents };
}

// Auto-pull Snapchat ad spend via the ad-account stats (spend is in MICRO-currency → ÷1e6).
export async function syncSnapchatAdsSpend(orgId, { days = 30 } = {}) {
    const conn = await StorefrontChannelConnection.findOne({ orgId, channel: "snapchat" });
    if (!conn) throw httpError(400, "Snapchat is not connected.");
    const adAccountId = String(conn.adsCustomerId || "").trim();
    if (!adAccountId) throw httpError(400, "Set your Snapchat Ad Account ID first.");
    const token = await _validToken(conn);
    const u = new URL(`https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/stats`);
    u.search = new URLSearchParams({ granularity: "DAY", fields: "spend", start_time: `${_daysAgo(days)}T00:00:00.000-00:00`, end_time: `${_iso(new Date())}T00:00:00.000-00:00` }).toString();
    const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw httpError(400, j.debug_message || j.request_status || "Snapchat stats failed");
    let dates = 0, totalCents = 0;
    for (const row of j.timeseries_stats?.[0]?.timeseries_stat?.timeseries || []) {
        const date = String(row.start_time || "").slice(0, 10); if (!date) continue;
        const cents = Math.round(((Number(row.stats?.spend) || 0) / 1e6) * 100);   // micro → dollars → cents
        await StorefrontAdSpend.updateOne({ orgId, channel: "snapchat", date, source: "snapchat_ads" }, { $set: { amountCents: cents } }, { upsert: true });
        dates++; totalCents += cents;
    }
    return { dates, totalCents };
}

// Dispatcher: pull ad spend for one channel.
const _ADSPEND_FN = { google: syncGoogleAdsSpend, meta: syncMetaAdsSpend, microsoft: syncMicrosoftAdsSpend, pinterest: syncPinterestAdsSpend, tiktok: syncTiktokAdsSpend, snapchat: syncSnapchatAdsSpend };
export async function syncChannelAdSpend(orgId, channel) {
    const fn = _ADSPEND_FN[channel];
    if (!fn) throw httpError(400, "Ad-spend sync isn't supported for this channel.");
    return fn(orgId, {});
}

// Cron: pull ad spend for every store that connected an ads-capable channel + set an ads account id.
export async function syncAllAdsSpend() {
    const gated = { google: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN, microsoft: !!(process.env.MICROSOFT_ADS_DEVELOPER_TOKEN && process.env.MICROSOFT_ADS_CUSTOMER_ID) };
    const out = {};
    for (const channel of Object.keys(_ADSPEND_FN)) {
        if (gated[channel] === false) continue;   // env-gated channels skipped when not configured
        out[channel] = 0;
        const conns = await StorefrontChannelConnection.find({ channel, adsCustomerId: { $nin: [null, ""] } }).select("orgId").limit(2000).lean();
        for (const c of conns) { try { await syncChannelAdSpend(c.orgId, channel); out[channel]++; } catch { /* skip */ } }
    }
    out.stores = Object.values(out).reduce((a, b) => a + b, 0);
    return out;
}

// Dry-run: build the exact outgoing catalog request for a channel WITHOUT sending — for validating
// the doc-modeled shapes against the provider's API (diff / paste into Postman with a real token).
export async function channelPreview(orgId, channel) {
    if (!CHANNELS[channel]) throw httpError(404, "Unknown channel");
    const [p] = await _channelProductResources(orgId, channel);
    if (!p) return { channel, note: "No products to preview yet." };
    const price = `${p.price.value} ${p.price.currency}`;
    const M = {
        google:    { method: "POST", endpoint: "https://shoppingcontent.googleapis.com/content/v2.1/products/batch", body: { entries: [{ batchId: 1, merchantId: "<merchantId>", method: "insert", product: p }] } },
        microsoft: { method: "POST", endpoint: "https://content.api.bingads.microsoft.com/shopping/v9.1/bmc/<storeId>/products/batch", body: { entries: [{ batchId: 1, merchantId: "<storeId>", method: "insert", product: p }] } },
        meta:      { method: "POST", endpoint: "https://graph.facebook.com/v21.0/<catalogId>/items_batch", body: { item_type: "PRODUCT_ITEM", requests: [{ method: "UPDATE", retailer_id: p.offerId, data: { name: p.title, description: p.description, availability: "in stock", condition: "new", price: Math.round(parseFloat(p.price.value) * 100), currency: p.price.currency, url: p.link, image_url: p.imageLink, brand: p.brand } }] } },
        pinterest: { method: "POST", endpoint: "https://api.pinterest.com/v5/catalogs/items/batch", body: { country: "US", language: "EN", operation: "UPSERT", items: [{ item_id: p.offerId, attributes: { title: p.title, description: p.description, link: p.link, image_link: p.imageLink, availability: "in stock", condition: "new", price, brand: p.brand } }] } },
        tiktok:    { method: "POST", endpoint: "https://business-api.tiktok.com/open_api/v1.3/catalog/product/upload/", body: { bc_id: "<TIKTOK_BC_ID>", catalog_id: "<catalogId>", file_url: "<your feed URL>" }, note: "TikTok ingests via the feed file URL, not per-item." },
        snapchat:  { method: "POST", endpoint: "https://adsapi.snapchat.com/v1/catalogs/<catalogId>/products", body: { products: [{ id: p.offerId, title: p.title, description: p.description, link: p.link, image_link: p.imageLink, availability: "in stock", condition: "new", price, brand: p.brand }] } },
        x:         { method: "POST", endpoint: "https://ads-api.x.com/12/product_catalogs/<catalogId>/products", body: { products: [{ product_id: p.offerId, title: p.title, description: p.description, link: p.link, image_link: p.imageLink, availability: "in stock", condition: "new", price, brand: p.brand }] } },
    };
    return { channel, ...(M[channel] || { note: "Feed-based — no per-item request." }) };
}

// REAL per-order channel ROI: each order is attributed to its acquisition channel (order.attribution
// resolved at placement), landed-cost P&L (same formula as profitAnalytics) summed per channel, and
// refunds attributed back to each order's channel — true net profit per channel, no estimates.
const _chanOf = (src) => { const s = String(src || "direct").toLowerCase(); return _SOURCE_CHANNEL[s] || (s === "direct" || s === "" ? "direct" : s); };
export async function channelRoi(orgId, range = "30d") {
    const oid = new mongoose.Types.ObjectId(orgId);
    const days = RANGES[range] || 30;
    const start = new Date(Date.now() - days * 86400000);
    const [orderAgg, refundAgg, spendAgg] = await Promise.all([
        PlatformOrder.aggregate([
            { $match: { orgId: oid, source: "storefront", date: { $gte: start } } },
            { $project: {
                source: { $ifNull: ["$attribution.source", "direct"] },
                subtotal: { $ifNull: ["$storefrontPayout.subtotalCents", 0] },
                wholesale: { $ifNull: ["$storefrontPayout.wholesaleCents", 0] },
                stripeFee: { $ifNull: ["$storefrontPayout.stripeFeeCents", 0] },
                discount: { $add: [{ $multiply: [{ $ifNull: ["$discountAmount", 0] }, 100] }, { $ifNull: ["$rewardsRedeemedCents", 0] }, { $ifNull: ["$giftCardRedeemedCents", 0] }] },
            } },
            { $project: {
                source: 1, wholesale: 1,
                netSales: { $subtract: ["$subtotal", "$discount"] },
                fees: { $add: ["$stripeFee", { $round: [{ $multiply: ["$subtotal", 0.01] }, 0] }] },
            } },
            { $group: { _id: "$source", orders: { $sum: 1 }, revenueCents: { $sum: "$netSales" }, profitCents: { $sum: { $subtract: ["$netSales", { $add: ["$wholesale", "$fees"] }] } } } },
        ]),
        // Refunds attributed to the refunded order's acquisition channel (lookup → orders collection).
        StorefrontReturn.aggregate([
            { $match: { orgId: oid, status: "refunded", updatedAt: { $gte: start } } },
            { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "ord" } },
            { $unwind: { path: "$ord", preserveNullAndEmptyArrays: true } },
            { $group: { _id: { $ifNull: ["$ord.attribution.source", "direct"] }, refunds: { $sum: "$refundCents" } } },
        ]),
        StorefrontAdSpend.aggregate([{ $match: { orgId: oid, date: { $gte: _daysAgo(days) } } }, { $group: { _id: "$channel", spend: { $sum: "$amountCents" } } }]),
    ]);
    const rev = {}, prof = {}, ords = {}, ref = {};
    for (const r of orderAgg) { const ch = _chanOf(r._id); rev[ch] = (rev[ch] || 0) + r.revenueCents; prof[ch] = (prof[ch] || 0) + r.profitCents; ords[ch] = (ords[ch] || 0) + r.orders; }
    for (const r of refundAgg) { const ch = _chanOf(r._id); ref[ch] = (ref[ch] || 0) + (r.refunds || 0); }
    const spendByCh = Object.fromEntries((spendAgg || []).map((s) => [s._id, s.spend]));
    const channels = new Set([...Object.keys(rev), ...Object.keys(ref), ...Object.keys(spendByCh)]);
    const rows = [...channels].map((ch) => {
        const revenueCents = rev[ch] || 0, spendCents = spendByCh[ch] || 0, refundsCents = ref[ch] || 0;
        const profitCents = (prof[ch] || 0) - refundsCents;   // net of returns
        return { channel: ch, name: CHANNELS[ch]?.name || (ch === "direct" ? "Direct / organic" : ch), orders: ords[ch] || 0, revenueCents, refundsCents, spendCents, profitCents, profitAfterSpendCents: profitCents - spendCents, roas: spendCents > 0 ? Math.round((revenueCents / spendCents) * 100) / 100 : null };
    }).sort((x, y) => y.revenueCents - x.revenueCents);
    return { range, rows, perOrder: true };
}

// ── Seller-as-supplier duality ────────────────────────────────────────────────
// A storefront seller (commerce org) can ALSO earn as a network fulfiller: enrolling registers
// them as a routing provider (ProviderCapacity/Location), so other sellers' overflow orders can
// route to their spare capacity. Same org both buys AND sells fulfillment — competitors keep
// each tenant a closed island; the Pythias network lets them play both sides. Ties to FC overflow.
// Eligibility to JOIN the fulfillment network: a seller must have been on Pythias at least 3 months AND
// have an average ship time (order date → shipped) of 4 days or less over a real track record of orders.
// This protects the network's delivery promise before routing other sellers' orders to them.
const FULFILLER_MIN_MONTHS = 3;
const FULFILLER_MAX_SHIP_DAYS = 4;
const FULFILLER_MIN_ORDERS = 5;   // need a track record to measure shipping speed against

export async function supplierEligibility(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const since = new Date(Date.now() - 180 * 86400000);   // measure ship speed over the last 180 days
    const [org, agg] = await Promise.all([
        Organization.findById(oid).select("createdAt").lean(),
        PlatformOrder.aggregate([
            { $match: { orgId: oid, "shipping.shippedAt": { $ne: null }, date: { $gte: since } } },
            { $project: { days: { $divide: [{ $subtract: ["$shipping.shippedAt", "$date"] }, 86400000] } } },
            { $match: { days: { $gte: 0 } } },
            { $group: { _id: null, avgDays: { $avg: "$days" }, count: { $sum: 1 } } },
        ]).catch(() => []),
    ]);
    const created = org?.createdAt ? new Date(org.createdAt).getTime() : Date.now();
    const tenureMonths = Math.max(0, Math.floor((Date.now() - created) / (30 * 86400000)));
    const ordersSampled = agg?.[0]?.count || 0;
    const shipAvgDays = agg?.[0]?.avgDays != null ? Math.round(agg[0].avgDays * 10) / 10 : null;

    const tenureOk = tenureMonths >= FULFILLER_MIN_MONTHS;
    const haveShipData = ordersSampled >= FULFILLER_MIN_ORDERS;
    const shipOk = haveShipData && shipAvgDays != null && shipAvgDays <= FULFILLER_MAX_SHIP_DAYS;
    const reasons = [];
    if (!tenureOk) reasons.push(`Be on Pythias at least ${FULFILLER_MIN_MONTHS} months (you're at ${tenureMonths}).`);
    if (!haveShipData) reasons.push(`Build a shipping track record — ${FULFILLER_MIN_ORDERS}+ shipped orders needed (you have ${ordersSampled}).`);
    else if (!shipOk) reasons.push(`Keep your average ship time to ${FULFILLER_MAX_SHIP_DAYS} days or less (yours is ${shipAvgDays}).`);
    return {
        eligible: tenureOk && shipOk,
        tenureMonths, monthsRequired: FULFILLER_MIN_MONTHS, tenureOk,
        shipAvgDays, maxShipDays: FULFILLER_MAX_SHIP_DAYS, ordersSampled, minOrders: FULFILLER_MIN_ORDERS, shipOk, haveShipData,
        reasons,
    };
}

export async function supplierStatus(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const [cap, loc, catalogCount, score] = await Promise.all([
        ProviderCapacity.findOne({ providerId: oid }).lean(),
        ProviderLocation.findOne({ providerId: oid, isPrimary: true }).lean(),
        ProviderCatalog.countDocuments({ providerId: oid, active: true }),
        ProviderScore.findOne({ providerId: oid }).lean(),
    ]);
    const kycStatus = cap?.kycStatus || "none";
    return {
        enrolled: !!cap,
        kycStatus,                                   // none | submitted | verified | rejected
        live: !!(cap?.acceptsCommerceCloud && kycStatus === "verified"),
        kyc: cap?.kyc ? { legalName: cap.kyc.legalName, businessType: cap.kyc.businessType, contactEmail: cap.kyc.contactEmail, submittedAt: cap.kyc.submittedAt, reason: cap.kyc.reason } : null,
        capacity: cap ? { isPaused: cap.isPaused, maxDailyOrders: cap.maxDailyOrders, currentDailyCount: cap.currentDailyCount, handlingFee: cap.handlingFee, allowOverflowIn: cap.allowOverflowIn, acceptsCommerceCloud: cap.acceptsCommerceCloud, warmupMode: cap.warmupMode } : null,
        location: loc ? { zip: loc.zip, state: loc.state, region: loc.region, country: loc.country } : null,
        catalogCount,
        score: score ? { onTimeRate30d: score.onTimeRate30d ?? null, defectRate30d: score.defectRate30d ?? null } : null,
    };
}
// Enroll as a network fulfiller — but DON'T go live until KYC is verified. acceptsCommerceCloud
// stays false (routing skips them) until verifySupplierKyc flips it on.
export async function enrollAsSupplier(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    // Gate: must meet the network's tenure + shipping-speed bar before enrolling.
    const elig = await supplierEligibility(orgId);
    if (!elig.eligible) throw httpError(403, elig.reasons.join(" ") || "You're not eligible to become a fulfiller yet.");
    const existing = await ProviderCapacity.findOne({ providerId: oid }).select("kycStatus").lean();
    const verified = existing?.kycStatus === "verified";
    await ProviderCapacity.updateOne(
        { providerId: oid },
        { $setOnInsert: { providerId: oid, warmupMode: true, maxDailyOrders: 50, handlingFee: 200, kycStatus: "none" }, $set: { allowOverflowIn: verified, acceptsCommerceCloud: verified } },
        { upsert: true }
    );
    if (!(await ProviderLocation.findOne({ providerId: oid, isPrimary: true }))) {
        await ProviderLocation.create({ providerId: oid, isPrimary: true, country: "US" });
    }
    return supplierStatus(orgId);
}
// Seller submits KYC for review (→ "submitted"). Pythias ops verifies via verifySupplierKyc.
export async function submitSupplierKyc(orgId, kyc = {}) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const cap = await ProviderCapacity.findOne({ providerId: oid }).select("_id").lean();
    if (!cap) throw httpError(400, "Enroll as a fulfiller first.");
    const clean = {};
    for (const f of ["legalName", "taxId", "businessType", "address", "contactEmail"]) if (kyc[f]) clean[`kyc.${f}`] = String(kyc[f]).slice(0, 200);
    if (!clean["kyc.legalName"] || !clean["kyc.taxId"]) throw httpError(400, "Legal name and tax ID are required.");
    await ProviderCapacity.updateOne({ providerId: oid }, { $set: { ...clean, kycStatus: "submitted", "kyc.submittedAt": new Date(), "kyc.reason": "" } });
    return supplierStatus(orgId);
}
// Pythias ops decision (internal). approve → verified + go live; else rejected with a reason.
export async function verifySupplierKyc(orgId, { approve, reason } = {}) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const set = approve
        ? { kycStatus: "verified", acceptsCommerceCloud: true, allowOverflowIn: true, "kyc.reviewedAt": new Date(), "kyc.reason": "" }
        : { kycStatus: "rejected", acceptsCommerceCloud: false, allowOverflowIn: false, "kyc.reviewedAt": new Date(), "kyc.reason": String(reason || "Not approved").slice(0, 300) };
    const r = await ProviderCapacity.updateOne({ providerId: oid }, { $set: set });
    if (!r.matchedCount) throw httpError(404, "Supplier not found");
    return { ok: true, kycStatus: set.kycStatus };
}
export async function updateSupplierControls(orgId, patch = {}) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const current = await ProviderCapacity.findOne({ providerId: oid }).select("kycStatus").lean();
    const verified = current?.kycStatus === "verified";
    const cap = {};
    if (patch.isPaused !== undefined) cap.isPaused = !!patch.isPaused;
    if (patch.maxDailyOrders !== undefined) cap.maxDailyOrders = Math.max(0, Number(patch.maxDailyOrders) || 0);
    if (patch.handlingFee !== undefined) cap.handlingFee = Math.max(0, Number(patch.handlingFee) || 0);
    if (patch.allowOverflowIn !== undefined) cap.allowOverflowIn = verified && !!patch.allowOverflowIn;   // can't take orders until verified
    if (patch.acceptsCommerceCloud !== undefined) cap.acceptsCommerceCloud = verified && !!patch.acceptsCommerceCloud;
    if (Object.keys(cap).length) await ProviderCapacity.updateOne({ providerId: oid }, { $set: cap });
    const loc = {};
    for (const f of ["zip", "state", "region", "country"]) if (patch[f] !== undefined) loc[f] = patch[f];
    if (Object.keys(loc).length) await ProviderLocation.updateOne({ providerId: oid, isPrimary: true }, { $set: loc }, { upsert: true });
    return supplierStatus(orgId);
}
export async function supplierOrders(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const logs = await RoutingLog.find({ selectedProviderId: oid }).sort({ createdAt: -1 }).limit(50).select("orderId handoffStatus providerOwed createdAt").lean();
    const orders = logs.length ? await PlatformOrder.find({ _id: { $in: logs.map((l) => l.orderId) } }).select("poNumber status").lean() : [];
    const omap = new Map(orders.map((o) => [String(o._id), o]));
    const recent = logs.map((l) => { const o = omap.get(String(l.orderId)); return { poNumber: o?.poNumber || String(l.orderId).slice(-6), orderStatus: o?.status || "—", handoffStatus: l.handoffStatus, earnedCents: l.providerOwed || 0, at: l.createdAt }; });
    const [tot] = await RoutingLog.aggregate([{ $match: { selectedProviderId: oid } }, { $group: { _id: null, earned: { $sum: "$providerOwed" }, count: { $sum: 1 } } }]);
    return { recent, totalEarnedCents: tot?.earned || 0, ordersFulfilled: tot?.count || 0 };
}

// ── Merchant of Record (tax remittance + disputes) ────────────────────────────
// Pythias is the MoR for storefront sales: we collect & remit sales tax and own chargebacks so
// the seller never touches tax filing or representment. This summary proves it + feeds filing.
const RANGES_MOR = { "30d": 30, "90d": 90, "365d": 365, ytd: 0 };
export async function morSummary(orgId, range = "90d") {
    const oid = new mongoose.Types.ObjectId(orgId);
    const start = range === "ytd"
        ? new Date(new Date().getUTCFullYear(), 0, 1)
        : new Date(Date.now() - (RANGES_MOR[range] || 90) * 86400000);

    const [taxAgg, totalsAgg, disputes] = await Promise.all([
        PlatformOrder.aggregate([
            { $match: { orgId: oid, source: "storefront", date: { $gte: start }, taxAmountCents: { $gt: 0 } } },
            { $group: { _id: "$shippingAddress.state", taxCents: { $sum: "$taxAmountCents" }, orders: { $sum: 1 } } },
            { $sort: { taxCents: -1 } },
        ]),
        PlatformOrder.aggregate([
            { $match: { orgId: oid, source: "storefront", date: { $gte: start } } },
            { $group: { _id: null, grossCents: { $sum: { $multiply: ["$total", 100] } }, taxCents: { $sum: "$taxAmountCents" }, orders: { $sum: 1 } } },
        ]),
        StorefrontDispute.find({ orgId: oid }).sort({ openedAt: -1 }).limit(50).lean(),
    ]);
    const tot = totalsAgg[0] || {};
    const openStates = ["open"];
    return {
        range,
        sales: { grossCents: Math.round(tot.grossCents || 0), orders: tot.orders || 0 },
        tax: {
            totalCents: tot.taxCents || 0,
            byState: taxAgg.map((t) => ({ state: t._id || "—", taxCents: t.taxCents, orders: t.orders })),
            jurisdictions: taxAgg.length,
        },
        disputes: {
            open: disputes.filter((d) => openStates.includes(d.state)).length,
            total: disputes.length,
            lostCents: disputes.filter((d) => d.state === "lost").reduce((a, d) => a + (d.amountCents || 0), 0),
            recent: disputes.slice(0, 20).map((d) => ({ poNumber: d.poNumber, amountCents: d.amountCents, reason: d.reason, state: d.state, status: d.status, openedAt: d.openedAt, dueBy: d.dueBy })),
        },
    };
}

// ── Network protection (shared fraud blocklist + deliverability) ──────────────
// Seller-facing view of the cross-store protection. The actual screening/suppression happens in
// the storefront app (checkout + outbox) via @pythias/mongo's networkGuard; here sellers see the
// shared shield and can report bad actors that then protect EVERY store on the network.
export async function networkProtectionSummary(orgId) {
    const oid = new mongoose.Types.ObjectId(orgId);
    const [blocklistSize, suppressionSize, caughtAgg, reportedByYou, recent] = await Promise.all([
        NetworkFraudEntry.countDocuments({ active: true }),
        NetworkSuppression.estimatedDocumentCount(),
        NetworkFraudEntry.aggregate([{ $group: { _id: null, hits: { $sum: "$hits" } } }]),
        NetworkFraudEntry.countDocuments({ "reports.orgId": oid }),
        NetworkFraudEntry.find({ active: true }).sort({ lastSeen: -1 }).limit(25).select("type masked severity reason hits lastSeen").lean(),
    ]);
    return { blocklistSize, suppressionSize, caughtNetwork: caughtAgg[0]?.hits || 0, reportedByYou, recent };
}
export async function reportBadActor(orgId, { type, value, reason = "manual", severity = 3 } = {}) {
    if (!["email", "phone", "address", "ip"].includes(type) || !value) throw httpError(400, "type and value required");
    const e = await reportNetworkFraud({ type, value, reason, orgId, severity });
    return { ok: true, masked: e?.masked, message: `Added ${e?.masked || "entry"} to the network blocklist — every store is now protected.` };
}

// ── AI demand forecasting & auto-restock ──────────────────────────────────────
// Per-product unit demand from the StorefrontProductStat daily rollup: trailing velocity +
// trend → projected demand → days-to-stockout & reorder qty (when the product tracks stock).
// The store-level AI curve (Chronos sidecar) is computed by the daily cron and cached.
const _iso = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
const _daysAgo = (n) => _iso(new Date(Date.now() - n * 86400000));
const _round1 = (x) => Math.round(x * 10) / 10;

export async function demandForecast(orgId, { horizonDays = 30, lookbackDays = 90 } = {}) {
    const since = _daysAgo(lookbackDays), d30 = _daysAgo(30), d60 = _daysAgo(60);
    const [stats, invDocs, cache] = await Promise.all([
        StorefrontProductStat.find({ orgId, date: { $gte: since } }).select("date productId purchasedUnits").lean(),
        StorefrontInventory.find({ orgId }).lean(),
        StorefrontDemandCache.findOne({ orgId }).lean(),
    ]);
    const invMap = new Map(invDocs.map((i) => [String(i.productId), i]));
    const byProduct = new Map();
    for (const s of stats) {
        const k = String(s.productId);
        if (!byProduct.has(k)) byProduct.set(k, { total: 0, u30: 0, u60: 0, activeDays: new Set() });
        const b = byProduct.get(k), u = s.purchasedUnits || 0;
        b.total += u;
        if (u > 0) b.activeDays.add(s.date);
        if (s.date >= d30) b.u30 += u; else if (s.date >= d60) b.u60 += u;
    }
    const ids = [...byProduct.keys()];
    const products = ids.length ? await PlatformProduct.find({ _id: { $in: ids } }).select("title sku").lean() : [];
    const titleMap = new Map(products.map((p) => [String(p._id), p]));

    const out = [];
    for (const [k, b] of byProduct) {
        const avgDaily = b.u30 / 30;
        const prevDaily = b.u60 / 30;
        const trendPct = prevDaily > 0.05 ? Math.round(((avgDaily - prevDaily) / prevDaily) * 100) : 0;
        const factor = 1 + Math.max(-0.5, Math.min(0.5, trendPct / 100));
        const projected = Math.round(avgDaily * horizonDays * factor);
        const inv = invMap.get(k);
        const tracked = !!inv;
        const p = titleMap.get(k) || {};
        const rec = {
            productId: k, title: p.title || "(untitled)", sku: p.sku || "",
            soldUnits: b.total, avgDaily: _round1(avgDaily), trendPct, projected,
            tracked, onHand: inv?.onHand ?? null, autoReorder: !!inv?.autoReorder, supplierEmail: inv?.supplierEmail || "",
            daysToStockout: null, risk: "ok", recommendedQty: 0, reorderPoint: 0,
        };
        if (tracked && avgDaily > 0) {
            const leadDays = inv.leadDays ?? 7, safetyDays = inv.safetyDays ?? 3;
            const reorderPoint = inv.reorderPoint > 0 ? inv.reorderPoint : Math.ceil(avgDaily * (leadDays + safetyDays));
            const dts = inv.onHand / avgDaily;
            rec.reorderPoint = reorderPoint;
            rec.daysToStockout = Math.round(dts);
            rec.risk = dts < leadDays ? "critical" : dts < leadDays + 7 ? "warning" : "ok";
            if (inv.onHand <= reorderPoint) rec.recommendedQty = Math.max(1, Math.ceil(avgDaily * (leadDays + 30) - inv.onHand));
        } else if (tracked && inv.onHand === 0) {
            rec.daysToStockout = 0; rec.risk = "critical";
        }
        out.push(rec);
    }
    out.sort((a, b) => b.projected - a.projected || b.soldUnits - a.soldUnits);
    return {
        horizonDays, computedAt: cache?.computedAt || null,
        aiNext30: cache?.aiNext30 || null, aiNext90: cache?.aiNext90 || null, aiCurve: cache?.aiCurve || null,
        products: out,
        atRisk: out.filter((r) => r.risk !== "ok").length,
    };
}

// Roll storefront product demand UP into blank (style+color+size) demand — what the FULFILLER
// actually needs to stock for made-to-order products. Built directly from this store's order
// items (the same signal Premier's blank forecast uses). This is the POD-native "restock":
// the inventory risk lives in blanks at the fulfiller, not finished goods at the seller.
export async function blankDemandForecast(orgId, { horizonDays = 30, lookbackDays = 90 } = {}) {
    const since = new Date(Date.now() - lookbackDays * 86400000);
    const recentCut = new Date(Date.now() - 30 * 86400000);
    const orders = await PlatformOrder.find({ orgId, source: "storefront", date: { $gte: since } }).select("_id").limit(20000).lean();
    if (!orders.length) return { horizonDays, blanks: [], byStyle: [], totalProjected: 0 };
    const ids = orders.map((o) => o._id);
    const rows = await PlatformItem.aggregate([
        { $match: { order: { $in: ids }, canceled: { $ne: true } } },
        { $group: {
            _id: { style: "$styleCode", color: "$colorName", size: "$sizeName" },
            units:  { $sum: 1 },                                                   // one Item = one physical piece
            recent: { $sum: { $cond: [{ $gte: ["$date", recentCut] }, 1, 0] } },
        } },
    ]);
    const days = Math.max(1, lookbackDays);
    const blanks = rows
        .filter((r) => r._id.style)
        .map((r) => {
            const avgDaily = r.recent > 0 ? r.recent / 30 : r.units / days;        // recency-weighted when recent sales exist
            return { style: r._id.style, color: r._id.color || "—", size: r._id.size || "—", units: r.units, avgDaily: _round1(avgDaily), projected: Math.round(avgDaily * horizonDays) };
        })
        .filter((b) => b.projected > 0)
        .sort((a, b) => b.projected - a.projected);
    const styleMap = new Map();
    for (const b of blanks) {
        if (!styleMap.has(b.style)) styleMap.set(b.style, { style: b.style, projected: 0, units: 0, variants: [] });
        const s = styleMap.get(b.style);
        s.projected += b.projected; s.units += b.units; s.variants.push(b);
    }
    const byStyle = [...styleMap.values()].sort((a, b) => b.projected - a.projected);
    return { horizonDays, blanks, byStyle, totalProjected: blanks.reduce((a, b) => a + b.projected, 0) };
}

// Reconcile the storefront blank-demand rollup against the FULFILLER's real blank inventory
// (Premier `Inventory`, keyed style·color·size) → suggested incremental order per line + vendor
// grouping. Only meaningful where blank inventory exists (i.e. run from the Premier app). Note:
// Premier's global blank forecast already counts these order items — we DON'T add to that
// forecast (would double-count); we surface the storefront-attributed reorder and let an admin
// create a PO, which bumps Inventory.pending (the forecast's "available") to close the loop.
export async function reconcileBlankDemand(orgId, { horizonDays = 30 } = {}) {
    const demand = await blankDemandForecast(orgId, { horizonDays });
    if (!demand.blanks.length) return { horizonDays, rows: [], byVendor: [], totalSuggested: 0, totalOrderValue: 0, tracked: 0 };
    const styleCodes = [...new Set(demand.blanks.map((b) => b.style))];
    const [invDocs, blanks] = await Promise.all([
        Inventory.find({ style_code: { $in: styleCodes } }).select("style_code color_name size_name quantity pending_quantity order_at_quantity unit_cost").lean(),
        Blank.find({ code: { $in: styleCodes } }).select("code sizes vendor").lean(),
    ]);
    const invMap = new Map(invDocs.map((i) => [`${i.style_code}||${i.color_name}||${i.size_name}`, i]));
    const costMap = {}, vendorMap = {};
    for (const b of blanks) { costMap[b.code] = {}; vendorMap[b.code] = b.vendor || ""; for (const sz of b.sizes ?? []) costMap[b.code][sz.name] = sz.wholesaleCost ?? 0; }
    const rows = demand.blanks.map((b) => {
        const inv = invMap.get(`${b.style}||${b.color}||${b.size}`);
        const tracked = !!inv;
        const onHand = inv?.quantity ?? null, pending = inv?.pending_quantity ?? 0;
        const available = tracked ? onHand + pending : null;
        const suggested = tracked ? Math.max(0, b.projected - available) : b.projected;   // untracked → assume must order all
        const unitCost = costMap[b.style]?.[b.size] ?? inv?.unit_cost ?? 0;
        return { style: b.style, color: b.color, size: b.size, projected: b.projected, onHand, pending, available, suggested, unitCost, orderValue: Math.round(suggested * unitCost * 100) / 100, vendor: vendorMap[b.style] || "", inventoryId: inv?._id ? String(inv._id) : null, tracked };
    }).filter((r) => r.suggested > 0);
    const vmap = new Map();
    for (const r of rows) { const v = r.vendor || "Unassigned"; if (!vmap.has(v)) vmap.set(v, { vendor: v, units: 0, value: 0, lines: 0 }); const g = vmap.get(v); g.units += r.suggested; g.value += r.orderValue; g.lines++; }
    return {
        horizonDays, rows,
        byVendor: [...vmap.values()].map((v) => ({ ...v, value: Math.round(v.value * 100) / 100 })).sort((a, b) => b.value - a.value),
        totalSuggested: rows.reduce((a, r) => a + r.suggested, 0),
        totalOrderValue: Math.round(rows.reduce((a, r) => a + r.orderValue, 0) * 100) / 100,
        tracked: rows.filter((r) => r.tracked).length,
    };
}

// Create a DRAFT blank PO (InventoryOrders) from reconcile lines, grouped to one vendor, and
// bump Inventory.pending so Premier's blank forecast sees the on-order qty (no double-order).
export async function createBlankPO(orgId, { lines = [], vendor = "" } = {}) {
    const valid = (lines || []).filter((l) => l.inventoryId && Number(l.quantity || l.suggested) > 0)
        .map((l) => ({ inventory: l.inventoryId, quantity: Number(l.quantity || l.suggested) }));
    if (!valid.length) throw httpError(400, "No stocked lines to order (untracked blanks have no inventory record yet).");
    const poNumber = `SF-${Date.now().toString(36).toUpperCase()}`;
    await InventoryOrders.create({
        orgId, orderType: "blank", vendor: vendor || "Unassigned", poNumber, dateOrdered: new Date(), received: false,
        locations: [{ name: "Main", received: false, items: valid }],
    });
    for (const l of valid) await Inventory.updateOne({ _id: l.inventory }, { $inc: { pending_quantity: l.quantity } });
    return { ok: true, poNumber, lines: valid.length, units: valid.reduce((a, l) => a + l.quantity, 0), message: `Draft blank PO ${poNumber} created — ${valid.length} lines, ${valid.reduce((a, l) => a + l.quantity, 0)} units. Inventory pending updated.` };
}

export async function getInventory(orgId) {
    return StorefrontInventory.find({ orgId }).lean();
}
export async function saveInventory(orgId, productId, patch = {}) {
    if (!productId) throw httpError(400, "productId required");
    const set = {};
    for (const f of ["onHand", "reorderPoint", "leadDays", "safetyDays"]) if (patch[f] !== undefined) set[f] = Math.max(0, Number(patch[f]) || 0);
    if (patch.supplierName !== undefined) set.supplierName = String(patch.supplierName).slice(0, 120);
    if (patch.supplierEmail !== undefined) set.supplierEmail = String(patch.supplierEmail).slice(0, 200);
    if (patch.autoReorder !== undefined) set.autoReorder = !!patch.autoReorder;
    const doc = await StorefrontInventory.findOneAndUpdate({ orgId, productId }, { $set: set, $setOnInsert: { orgId, productId } }, { new: true, upsert: true });
    return doc.toObject();
}

export async function listRestockTasks(orgId, status) {
    const q = { orgId };
    if (status) q.status = status;
    return StorefrontRestockTask.find(q).sort({ createdAt: -1 }).limit(500).lean();
}
export async function createRestockTask(orgId, { productId, qty, title, supplierEmail, source = "manual", note = "", createdBy = "" } = {}) {
    if (!productId) throw httpError(400, "productId required");
    // Avoid piling duplicates: reuse an existing open task for this product.
    const existing = await StorefrontRestockTask.findOne({ orgId, productId, status: "open" });
    if (existing) {
        if (qty) { existing.qty = Number(qty) || existing.qty; await existing.save(); }
        return { ok: true, task: existing.toObject(), message: `Updated open reorder for "${existing.title || "product"}".`, deduped: true };
    }
    const task = await StorefrontRestockTask.create({ orgId, productId, title: title || "", qty: Math.max(0, Number(qty) || 0), supplierEmail: supplierEmail || "", source, note, createdBy });
    return { ok: true, task: task.toObject(), message: `Reorder opened for ${task.qty} × "${task.title || "product"}".` };
}
export async function updateRestockTask(orgId, id, status) {
    if (!["open", "ordered", "received", "cancelled"].includes(status)) throw httpError(400, "bad status");
    const t = await StorefrontRestockTask.findOneAndUpdate({ _id: id, orgId }, { $set: { status } }, { new: true });
    if (!t) throw httpError(404, "Not found");
    return t.toObject();
}

// Open auto restock tasks for autoReorder products that are at critical stockout risk.
// Returns the created tasks (with supplierEmail) so the cron can notify suppliers.
export async function runAutoRestock(orgId, forecast) {
    const f = forecast || await demandForecast(orgId, { horizonDays: 30 });
    const created = [];
    for (const p of f.products) {
        if (!p.autoReorder || p.risk !== "critical" || p.recommendedQty <= 0) continue;
        const r = await createRestockTask(orgId, { productId: p.productId, qty: p.recommendedQty, title: p.title, supplierEmail: p.supplierEmail, source: "auto", note: `Auto-reorder: ~${p.daysToStockout}d of stock left at ${p.avgDaily}/day.` });
        if (!r.deduped) { created.push(r.task); await StorefrontInventory.updateOne({ orgId, productId: p.productId }, { $set: { lastReorderAt: new Date() } }); }
    }
    return created;
}

// Chronos sidecar: store-level daily-units series → AI demand curve. Cached for the page.
async function computeDemandCache(orgId) {
    const since = _daysAgo(180);
    const rows = await StorefrontProductStat.aggregate([
        { $match: { orgId: new mongoose.Types.ObjectId(orgId), date: { $gte: since } } },
        { $group: { _id: "$date", units: { $sum: "$purchasedUnits" } } },
        { $sort: { _id: 1 } },
    ]);
    if (rows.length < 21) return null;   // not enough history for a stable AI curve
    const dates = rows.map((r) => r._id), units = rows.map((r) => r.units || 0);
    let aiCurve = null, aiNext30 = 0, aiNext90 = 0;
    try {
        const res = await fetch("http://127.0.0.1:5050/forecast", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dates, rev: units, net: units, ord: units, horizon: 90 }),
            signal: AbortSignal.timeout(180000),
        });
        if (res.ok) {
            const j = await res.json();
            const med = j.ord?.median || [];
            const last = new Date(dates[dates.length - 1] + "T00:00:00Z");
            const fdates = med.map((_, h) => { const d = new Date(last); d.setUTCDate(d.getUTCDate() + h + 1); return _iso(d); });
            aiCurve = { dates: fdates.slice(0, 90), units: med.slice(0, 90), p10: (j.ord?.p10 || []).slice(0, 90), p90: (j.ord?.p90 || []).slice(0, 90) };
            aiNext30 = Math.round(med.slice(0, 30).reduce((a, b) => a + b, 0));
            aiNext90 = Math.round(med.slice(0, 90).reduce((a, b) => a + b, 0));
        }
    } catch { /* sidecar down → cache the history only */ }
    await StorefrontDemandCache.findOneAndUpdate({ orgId }, { $set: { computedAt: new Date(), aiCurve, aiNext30, aiNext90 } }, { upsert: true });
    return { aiNext30, aiNext90 };
}

// Cron: refresh AI curve + run auto-restock for every published store. Returns supplier
// notifications for the caller (platform endpoint) to email.
export async function runAllDemandForecasts() {
    const sites = await StorefrontSite.find({ status: "published" }).select("orgId").limit(2000).lean();
    let stores = 0, tasksCreated = 0; const notify = [];
    for (const site of sites) {
        try {
            await computeDemandCache(site.orgId);
            const f = await demandForecast(site.orgId, { horizonDays: 30 });
            const created = await runAutoRestock(site.orgId, f);
            stores++; tasksCreated += created.length;
            for (const t of created) if (t.supplierEmail) notify.push({ orgId: String(site.orgId), taskId: String(t._id), supplierEmail: t.supplierEmail, title: t.title, qty: t.qty });
        } catch { /* skip store */ }
    }
    return { stores: sites.length, computed: stores, tasksCreated, notify };
}

// ── AI Store Autopilot (closed-loop optimization) ─────────────────────────────
// Reads the store's signals → proposes prioritized actions it can ACTUALLY apply (by calling
// the services below). Beyond suggestion tools: acts across analytics + marketing + i18n. The BEAT.
export async function autopilotRecommendations(orgId) {
    const client = await anthropic();
    const [a, p, i18n, demand] = await Promise.all([
        analyticsSummary(orgId, "30d").catch(() => null),
        profitAnalytics(orgId, "30d").catch(() => null),
        getI18nConfig(orgId).catch(() => ({})),
        demandForecast(orgId, { horizonDays: 30 }).catch(() => null),
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
    const risky = demand?.products?.filter((r) => r.risk !== "ok" && r.recommendedQty > 0).slice(0, 4) || [];
    if (risky.length) signals.push(`Stockout risk: ${risky.map((r) => `${r.title} (~${r.daysToStockout}d left, reorder ${r.recommendedQty} [id:${r.productId}])`).join("; ")}.`);
    if (!a || a.overview.sessions === 0) return { recommendations: [], note: "Not enough traffic yet — autopilot needs visitors to learn from." };

    const schema = `Allowed action types (use EXACTLY these):
- {"type":"automatic_discount","params":{"discountType":"percent|fixed|free_shipping","value":<percent or cents; 0 for free_shipping>,"title":"shopper label","minSubtotalCents":<0 ok>}}
- {"type":"create_flow","params":{"trigger":"signup|abandoned_cart|win_back|first_purchase","prompt":"what the email series should say"}}
- {"type":"create_campaign","params":{"channel":"email","audience":"all|customers|leads","prompt":"what the campaign announces"}}
- {"type":"translate","params":{"lang":"es|fr|de|it|pt|ja"}}
- {"type":"popup_experiment","params":{"prompt":"describe an alternative signup-popup variant to A/B test"}}
- {"type":"restock","params":{"productId":"<id from a Stockout-risk signal>","qty":<units to reorder>,"title":"<product name>"}}`;
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
    if (t === "restock") {
        const r = await createRestockTask(orgId, { productId: params.productId, qty: Number(params.qty) || 0, title: params.title, source: "autopilot", createdBy });
        return { ok: true, message: r.message };
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
    const type = b.type || "popup";
    if (type === "section" && (!b.target?.pageSlug || !b.target?.sectionId)) throw httpError(400, "section tests require a target page + section");
    return StorefrontExperiment.create({ orgId, name: b.name, type, status: "running", target: type === "section" ? b.target : undefined, variants: b.variants });
}

// The text-editable fields per section type — what a "section" A/B test can vary (copy/links/styling,
// not product queries). Drives the experiment composer's per-section override form.
const SECTION_TEST_FIELDS = {
    hero:             [["headline", "Headline"], ["subheadline", "Subheadline"], ["ctaText", "Button text"], ["ctaLink", "Button link"]],
    featuredProducts: [["heading", "Heading"]],
    collection:       [["heading", "Heading"]],
    richText:         [["heading", "Heading"], ["body", "Body"]],
    imageCollage:     [["heading", "Heading"], ["subheading", "Subheading"]],
};

// Sections in the store that can be A/B tested, grouped by page — for the experiment composer's picker.
export async function experimentTargets(orgId) {
    const site = await StorefrontSite.findOne({ orgId }).select("pages draft").lean();
    const pages = (site?.draft?.pages?.length ? site.draft.pages : site?.pages) || [];
    return pages.map((p) => ({
        slug: p.slug, title: p.title || p.slug,
        sections: (p.sections || []).map((s) => {
            const defs = SECTION_TEST_FIELDS[s.type];
            if (!defs) return null;
            return {
                id: String(s._id), type: s.type,
                fields: defs.map(([key, label]) => ({ key, label, value: s.settings?.[key] || "" })),
            };
        }).filter(Boolean),
    })).filter((p) => p.sections.length);
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
// Promote a variant to the winner: stop the test and apply the winning config live for the surfaces
// that persist (popup copy, the tested section's settings, the sale/announcement bar).
export async function promoteExperimentWinner(orgId, id, variantKey) {
    const exp = await StorefrontExperiment.findOne({ _id: id, orgId });
    if (!exp) throw httpError(404, "Not found");
    const win = exp.variants.find((v) => v.key === variantKey);
    if (!win) throw httpError(400, "Unknown variant");
    exp.winner = variantKey; exp.status = "stopped"; await exp.save();
    const cfg = win.config || {};
    let applied = false;

    if (exp.type === "popup") {
        const set = {};
        for (const k of ["headline", "body", "buttonText"]) if (cfg[k] != null) set[`popup.${k}`] = cfg[k];
        if (Object.keys(set).length) { await StorefrontSite.updateOne({ orgId }, { $set: set }); applied = true; }
    } else if (exp.type === "sale") {
        // Persist the winning offer to the always-on announcement bar.
        await StorefrontSite.updateOne({ orgId }, { $set: { announcement: { enabled: !!cfg.message, message: cfg.message, code: cfg.code, link: cfg.link, bg: cfg.bg, fg: cfg.fg } } });
        applied = true;
    } else if (exp.type === "section" && exp.target?.sectionId) {
        // Merge the winning overrides into the live (and draft) section settings.
        const site = await StorefrontSite.findOne({ orgId });
        if (site) {
            const apply = (pages) => {
                const page = (pages || []).find((p) => p.slug === exp.target.pageSlug);
                const sec = page?.sections?.find((s) => String(s._id) === String(exp.target.sectionId));
                if (sec) { sec.settings = { ...(sec.settings || {}), ...cfg }; return true; }
                return false;
            };
            const a = apply(site.pages); site.markModified("pages");
            if (site.draft?.pages) { apply(site.draft.pages); site.markModified("draft"); }
            if (a) { await site.save(); applied = true; }
        }
    }
    return { winner: variantKey, applied };
}
// AI-suggest a variant to test. Field shape depends on the surface under test.
export async function aiVariant({ type = "popup", goal = "more signups" }) {
    const client = await anthropic();
    const fields = type === "popup" ? `{"headline":"...","body":"...","buttonText":"..."}`
        : type === "sale" ? `{"message":"<short sale bar line, e.g. 'Summer Sale — 20% off everything'>","code":"<short promo code or empty>"}`
        : type === "section" ? `{"headline":"...","subheadline":"...","ctaText":"...","heading":"...","body":"..."}  (include ONLY the fields relevant to the section)`
        : `{"headline":"...","subheadline":"..."}`;
    const guide = type === "sale" ? "an enticing storewide sale/offer bar message" : `a punchy alternative ${type} variant`;
    const msg = await client.messages.create({ model: "claude-opus-4-8", max_tokens: 500, thinking: { type: "adaptive" }, messages: [{ role: "user", content: `Write ${guide} to A/B test for "${goal}". STRICT JSON only: ${fields}` }] });
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
