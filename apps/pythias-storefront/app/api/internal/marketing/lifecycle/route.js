export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer, StorefrontSite, StorefrontPushBroadcast, pushSegmentFilter } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { enqueueAbandonedCart, enqueueAbandonedSession } from "@/lib/emailFlows";
import { enrollFlows } from "@/lib/flows";
import { sendExpoPush } from "@/lib/push";

// POST /api/internal/marketing/lifecycle (run hourly by PM2) — enqueues abandoned-cart and
// abandoned-session nudges. Marketing category, so only opted-in + non-suppressed contacts get
// them (enforced at enqueue + send). Idempotency comes from the message dedupeKey.
const HOUR = 3600 * 1000, DAY = 24 * HOUR;

// Avoid middle-of-the-night pushes — gate to ~8am–9pm ET (most buyers are US). Email is unaffected.
function withinPushHours() {
    try {
        const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(new Date()));
        return h >= 8 && h < 21;
    } catch { return true; }
}

// Load each org's site once.
async function siteMap(orgIds) {
    const sites = await StorefrontSite.find({ orgId: { $in: orgIds } }).lean();
    return Object.fromEntries(sites.map((s) => [String(s.orgId), s]));
}

export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const now = Date.now();
    let cart = 0, session = 0, push = 0;

    // ── Abandoned cart: non-empty cart, idle 1h–72h, email-consented. ──
    const cartCandidates = await StorefrontCustomer.find({
        email: { $exists: true, $ne: null },
        "marketingConsent.email.optedIn": true,
        "cart.0": { $exists: true },
        cartUpdatedAt: { $lte: new Date(now - 1 * HOUR), $gte: new Date(now - 72 * HOUR) },
    }).limit(300).lean();

    if (cartCandidates.length) {
        const sites = await siteMap([...new Set(cartCandidates.map((c) => String(c.orgId)))]);
        for (const c of cartCandidates) {
            const site = sites[String(c.orgId)];
            if (!site) continue;
            const msg = await enqueueAbandonedCart(site, c).catch(() => null);
            if (msg) {
                cart++;
                await StorefrontCustomer.updateOne({ _id: c._id }, { $set: { abandonedCartSentAt: new Date() } });
                // App push nudge to the buyer's devices (best-effort; quiet-hours guarded). Email still goes regardless.
                const tokens = (c.pushTokens || []).map((t) => t.token).filter(Boolean);
                if (tokens.length && withinPushHours()) {
                    await sendExpoPush(tokens, {
                        title: "Still in your cart 🛒",
                        body: "You left something behind — tap to finish checking out.",
                        data: { type: "abandoned_cart" },
                    }).catch(() => {});
                    push++;
                }
            }
            // Also enroll any abandoned-cart automation flows (token = cart snapshot time).
            await enrollFlows({ orgId: c.orgId, site, customer: c, trigger: "abandoned_cart", token: c.cartUpdatedAt ? new Date(c.cartUpdatedAt).getTime().toString() : "x" }).catch(() => {});
        }
    }

    // ── Abandoned session: recently seen, empty cart, no nudge in 14 days. ──
    const sessCandidates = await StorefrontCustomer.find({
        email: { $exists: true, $ne: null },
        "marketingConsent.email.optedIn": true,
        $or: [{ cart: { $size: 0 } }, { cart: { $exists: false } }],
        lastSeenAt: { $lte: new Date(now - 2 * HOUR), $gte: new Date(now - 72 * HOUR) },
        $and: [{ $or: [{ abandonedSessionSentAt: { $exists: false } }, { abandonedSessionSentAt: { $lt: new Date(now - 14 * DAY) } }] }],
    }).limit(300).lean();

    if (sessCandidates.length) {
        const sites = await siteMap([...new Set(sessCandidates.map((c) => String(c.orgId)))]);
        for (const c of sessCandidates) {
            const site = sites[String(c.orgId)];
            if (!site) continue;
            const msg = await enqueueAbandonedSession(site, c).catch(() => null);
            if (msg) { session++; await StorefrontCustomer.updateOne({ _id: c._id }, { $set: { abandonedSessionSentAt: new Date() } }); }
        }
    }

    // ── Win-back: customers who haven't ordered in 60–120 days, not nudged yet. ──
    let winBack = 0;
    const winCandidates = await StorefrontCustomer.find({
        email: { $exists: true, $ne: null },
        "marketingConsent.email.optedIn": true,
        ordersCount: { $gte: 1 },
        lastOrderAt: { $lte: new Date(now - 60 * DAY), $gte: new Date(now - 120 * DAY) },
        $or: [{ winBackSentAt: { $exists: false } }, { winBackSentAt: { $lt: new Date(now - 60 * DAY) } }],
    }).limit(300).lean();
    if (winCandidates.length) {
        const sites = await siteMap([...new Set(winCandidates.map((c) => String(c.orgId)))]);
        for (const c of winCandidates) {
            const site = sites[String(c.orgId)];
            if (!site) continue;
            const n = await enrollFlows({ orgId: c.orgId, site, customer: c, trigger: "win_back", token: new Date(c.lastOrderAt).getTime().toString() }).catch(() => 0);
            if (n) { winBack++; await StorefrontCustomer.updateOne({ _id: c._id }, { $set: { winBackSentAt: new Date() } }); }
        }
    }

    // ── Scheduled push broadcasts: dispatch any that are due. ──
    // Implemented inline (this app doesn't import @pythias/backend) but reuses the SAME
    // pushSegmentFilter as the platform so a scheduled push targets exactly the previewed audience.
    // Audience is re-resolved fresh per row; each row is claimed atomically (status flip) so a re-run
    // can't double-send. Quiet-hours apply (these go to real phones).
    let scheduledPush = 0;
    if (withinPushHours()) {
        const due = await StorefrontPushBroadcast.find({ status: "scheduled", scheduledAt: { $lte: new Date() } }).limit(200).lean();
        for (const b of due) {
            const claimed = await StorefrontPushBroadcast.updateOne({ _id: b._id, status: "scheduled" }, { $set: { status: "sent" } });
            if (!claimed.modifiedCount) continue;
            const customers = await StorefrontCustomer.find(pushSegmentFilter(b.orgId, b.segment), { pushTokens: 1 }).lean();
            const tokens = [];
            for (const c of customers) for (const t of c.pushTokens || []) if (t?.token) tokens.push(t.token);
            await sendExpoPush(tokens, { title: b.title, body: b.body, data: { type: "broadcast", ...(b.url ? { url: b.url } : {}) } }).catch(() => {});
            await StorefrontPushBroadcast.updateOne({ _id: b._id }, { $set: { sentCount: tokens.length, recipients: customers.length } });
            scheduledPush++;
        }
    }

    return NextResponse.json({ abandonedCart: cart, abandonedCartPush: push, abandonedSession: session, winBack, scheduledPush });
}
