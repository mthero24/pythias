import { NextResponse } from "next/server";
import { PageView, Session, Conversion } from "@/models/Analytics";

// ── Bot detection ─────────────────────────────────────────────────────────────
const BOT_UA = /bot|crawler|spider|scraper|wget|curl|python-requests|python\/|java\/|go-http|apache-httpclient|googlebot|bingbot|yandexbot|baiduspider|duckduckbot|semrushbot|ahrefsbot|moz\/|petalbot|lighthouse|headless|puppeteer|playwright|selenium|phantomjs|cfnetwork|node-fetch|axios|okhttp|libwww/i;

function detectBot(ua, interacted) {
    if (!ua || ua.trim() === "") return { isBot: true, reason: "no-ua" };
    if (BOT_UA.test(ua))          return { isBot: true, reason: "ua-match" };
    // Pages where user never moved mouse, scrolled, clicked, or typed
    // are likely automated. Only flag on leave events where we know for sure.
    if (interacted === false)     return { isBot: true, reason: "no-interaction" };
    return { isBot: false, reason: null };
}

function getIp(req) {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

function parseSource(referrer, utmSource) {
    if (utmSource) return utmSource;
    if (!referrer) return "direct";
    try {
        const host = new URL(referrer).hostname.replace(/^www\./, "");
        if (host.includes("google"))  return "google";
        if (host.includes("bing"))    return "bing";
        if (host.includes("yahoo"))   return "yahoo";
        if (host.includes("tiktok"))  return "tiktok";
        if (host.includes("instagram")) return "instagram";
        if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
        if (host.includes("linkedin")) return "linkedin";
        if (host.includes("twitter") || host.includes("x.com")) return "twitter";
        return host;
    } catch { return "unknown"; }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json();
        const { type, sessionId, page, referrer, timeOnPage, interacted, vitals, source, medium, campaign, conversionEvent } = body;

        if (!sessionId || !page) return NextResponse.json({ ok: false }, { status: 400 });

        const ua = req.headers.get("user-agent") || "";
        const ip = getIp(req);

        if (type === "pageview") {
            const { isBot, reason } = detectBot(ua, null); // don't judge interaction yet on entry

            // Upsert session
            await Session.findOneAndUpdate(
                { sessionId },
                {
                    $setOnInsert: {
                        startedAt:  new Date(),
                        entryPage:  page,
                        referrer:   referrer || "",
                        userAgent:  ua,
                        ip,
                        source:     parseSource(referrer, source),
                        medium:     medium || "",
                        campaign:   campaign || "",
                        isBot,
                        botReason:  reason,
                    },
                    $set:  { lastSeen: new Date() },
                    $push: { pages: page },
                },
                { upsert: true, new: true }
            );

            // Create pageview record
            await PageView.create({
                sessionId, page,
                referrer: referrer || "",
                enteredAt: new Date(),
                userAgent: ua,
                ip,
                isBot,
                botReason: reason,
            });

        } else if (type === "leave") {
            const { isBot, reason } = detectBot(ua, interacted);

            // Update the most recent pageview for this session+page
            await PageView.findOneAndUpdate(
                { sessionId, page, timeOnPage: null },
                {
                    $set: {
                        timeOnPage: timeOnPage ?? 0,
                        interacted: interacted ?? false,
                        isBot,
                        botReason: reason,
                        ...(vitals && Object.keys(vitals).length ? { vitals } : {}),
                    },
                },
                { sort: { enteredAt: -1 } }
            );

            // Update session totalTime, exitPage, lastSeen, and bot status
            await Session.findOneAndUpdate(
                { sessionId },
                {
                    $set: {
                        lastSeen:  new Date(),
                        exitPage:  page,
                        isBot,
                        botReason: reason,
                    },
                    $inc: { totalTime: timeOnPage ?? 0 },
                }
            );

        } else if (type === "conversion") {
            if (!sessionId || !conversionEvent) return NextResponse.json({ ok: false }, { status: 400 });

            // Pull source/referrer from the session so conversions are attributable
            const session = await Session.findOne({ sessionId }).select("source referrer").lean();

            await Conversion.create({
                sessionId,
                conversionEvent,
                page: page || "",
                occurredAt: new Date(),
                source:   session?.source   || "",
                referrer: session?.referrer || "",
                ip: getIp(req),
            });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[analytics/collect]", e.message);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
