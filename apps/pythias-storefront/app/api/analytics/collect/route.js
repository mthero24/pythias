export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSession, StorefrontPathStat, StorefrontProductStat, StorefrontExperimentStat } from "@pythias/mongo";

const bumpExperiment = (orgId, experimentId, variant, inc) => {
    if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId) || !variant) return null;
    return StorefrontExperimentStat.updateOne({ orgId, experimentId: new mongoose.Types.ObjectId(experimentId), variant }, { $inc: inc }, { upsert: true });
};
import { resolveOrg } from "@/lib/resolveOrg";
import { dayKey, deviceFromUA, domainOf, cleanPath } from "@/lib/analytics";
import { sendGa4 } from "@/lib/ga4";

const countryOf = (req) => (req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || req.headers.get("x-country") || "").toUpperCase() || undefined;
// City/region come from Cloudflare's "Add visitor location headers" managed transform (off by default).
const regionOf = (req) => (req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region") || "").trim() || undefined;
const cityOf   = (req) => (req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city") || "").trim() || undefined;
const bumpProduct = (orgId, date, productId, inc) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return null;
    return StorefrontProductStat.updateOne({ orgId, date, productId: new mongoose.Types.ObjectId(productId) }, { $inc: inc }, { upsert: true });
};

// POST /api/analytics/collect — public, fire-and-forget beacon from the storefront tracker.
// Body: { type, sessionId, visitorId?, path?, referrer?, device?, vitals?, event?, durationMs?, revenueCents?, orderId? }
//   type: "pageview" | "vitals" | "event"   event: "add_to_cart" | "begin_checkout" | "purchase"
const QUIET = () => new Response(null, { status: 204 });

export async function POST(req) {
    let b;
    try { b = await req.json(); } catch { return QUIET(); }
    const sessionId = b?.sessionId;
    if (!sessionId) return QUIET();

    const ctx = await resolveOrg(req);
    const site = ctx?.site;
    if (!site) return QUIET();
    const orgId = site.orgId;
    // The native app has no Host header — derive one for the GA4 page_location URL.
    const host = req.headers.get("host") || site.customDomain?.hostname
        || (site.subdomain ? `${site.subdomain}.${process.env.STOREFRONT_BASE_DOMAIN || "pythias.store"}` : "app");
    const now = new Date();

    try {
        if (b.type === "pageview") {
            const path = cleanPath(b.path);
            const device = b.device || deviceFromUA(req.headers.get("user-agent") || "");
            const res = await StorefrontSession.updateOne(
                { sessionId },
                {
                    $set: { lastSeenAt: now, exitPath: path, orgId },
                    $inc: { pageviews: 1 },
                    $setOnInsert: {
                        startedAt: now, landingPath: path, visitorId: b.visitorId,
                        referrer: b.referrer || "", referrerDomain: domainOf(b.referrer), device,
                        country: countryOf(req), region: regionOf(req), city: cityOf(req),
                        utmSource: b.utm?.source || undefined, utmMedium: b.utm?.medium || undefined, utmCampaign: b.utm?.campaign || undefined,
                    },
                },
                { upsert: true }
            );
            // New session for a known visitor → mark returning (one extra query, only on insert).
            if (res.upsertedCount > 0 && b.visitorId) {
                const prior = await StorefrontSession.countDocuments({ orgId, visitorId: b.visitorId });
                if (prior > 1) await StorefrontSession.updateOne({ sessionId }, { $set: { returning: true } });
            }
            await StorefrontPathStat.updateOne({ orgId, date: dayKey(now), path }, { $inc: { views: 1 } }, { upsert: true });
            // Mirror to GA4 server-side (blocker-proof; the gtag loader is unreliable per-ID).
            await sendGa4(site, sessionId, [{ name: "page_view", params: { page_location: `https://${host}${path}`, page_referrer: b.referrer || undefined } }]);
            return QUIET();
        }

        // A/B test: a visitor was bucketed into a variant.
        if (b.type === "experiment_exposure") {
            await bumpExperiment(orgId, b.experimentId, b.variant, { exposures: 1 });
            return QUIET();
        }

        // Product analytics: a product detail view.
        if (b.type === "event" && b.event === "product_view") {
            await bumpProduct(orgId, dayKey(now), b.productId, { views: 1 });
            return QUIET();
        }

        if (b.type === "duration") {
            await StorefrontSession.updateOne({ sessionId }, { $set: { lastSeenAt: now }, $inc: { durationMs: Math.max(0, Number(b.durationMs) || 0) } });
            return QUIET();
        }

        if (b.type === "vitals" && b.vitals) {
            const path = cleanPath(b.path);
            const inc = {};
            for (const [k, field] of [["lcp", "lcp"], ["cls", "cls"], ["fcp", "fcp"], ["ttfb", "ttfb"], ["inp", "inp"]]) {
                const v = Number(b.vitals[k]);
                if (Number.isFinite(v) && v >= 0) { inc[`${field}Sum`] = v; inc[`${field}Count`] = 1; }
            }
            if (Object.keys(inc).length) {
                await StorefrontPathStat.updateOne({ orgId, date: dayKey(now), path }, { $inc: inc }, { upsert: true });
            }
            return QUIET();
        }

        if (b.type === "event") {
            const map = { add_to_cart: "addedToCart", begin_checkout: "startedCheckout", purchase: "converted" };
            const field = map[b.event];
            if (field) {
                const set = { [field]: true, lastSeenAt: now };
                if (b.event === "purchase") {
                    if (b.revenueCents != null) set.revenueCents = Math.max(0, Number(b.revenueCents) || 0);
                    if (b.orderId) set.orderId = b.orderId;
                }
                await StorefrontSession.updateOne({ sessionId }, { $set: set });

                const date = dayKey(now);
                if (b.event === "add_to_cart") await bumpProduct(orgId, date, b.productId, { addToCart: 1 });
                if (b.event === "purchase" && Array.isArray(b.items)) {
                    for (const it of b.items) await bumpProduct(orgId, date, it.productId, { purchasedUnits: Math.max(1, Number(it.qty) || 1) });
                }
                // A/B conversion: credit each experiment the buyer was bucketed into.
                if (b.event === "purchase" && Array.isArray(b.experiments)) {
                    for (const e of b.experiments) await bumpExperiment(orgId, e.id, e.variant, { conversions: 1 });
                }
            }
            // Mirror commerce events to GA4 server-side (purchase carries revenue + items).
            const GA4_EVENT = { add_to_cart: "add_to_cart", begin_checkout: "begin_checkout", purchase: "purchase" }[b.event];
            if (GA4_EVENT) {
                const params = {};
                if (b.event === "purchase") {
                    if (b.orderId) params.transaction_id = String(b.orderId);
                    params.value = (Number(b.revenueCents) || 0) / 100;
                    params.currency = "USD";
                }
                if (Array.isArray(b.items)) params.items = b.items.map((it) => ({
                    item_id: String(it.sku || it.productId || it.id || ""),
                    item_name: it.title || it.name || undefined,
                    quantity: Math.max(1, Number(it.qty) || 1),
                    price: it.priceCents != null ? Number(it.priceCents) / 100 : (it.price != null ? Number(it.price) : undefined),
                }));
                await sendGa4(site, sessionId, [{ name: GA4_EVENT, params }]);
            }
            return QUIET();
        }
    } catch { /* analytics never throws to the client */ }

    return QUIET();
}
