import { NextResponse } from "next/server";
import { PageView, Session } from "@/models/Analytics";

const BOT_UA = /bot|crawler|spider|scraper|wget|curl|python-requests|python\/|java\/|go-http|apache-httpclient|googlebot|bingbot|yandexbot|baiduspider|duckduckbot|semrushbot|ahrefsbot|moz\/|petalbot|lighthouse|headless|puppeteer|playwright|selenium|phantomjs|cfnetwork|node-fetch|axios|okhttp|libwww/i;

function detectBot(ua, interacted) {
    if (!ua || ua.trim() === "") return { isBot: true, reason: "no-ua" };
    if (BOT_UA.test(ua)) return { isBot: true, reason: "ua-match" };
    if (interacted === false) return { isBot: true, reason: "no-interaction" };
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
        if (host.includes("google"))   return "google";
        if (host.includes("bing"))     return "bing";
        if (host.includes("yahoo"))    return "yahoo";
        if (host.includes("tiktok"))   return "tiktok";
        if (host.includes("instagram")) return "instagram";
        if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
        if (host.includes("linkedin")) return "linkedin";
        if (host.includes("twitter") || host.includes("x.com")) return "twitter";
        return host;
    } catch { return "unknown"; }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { type, sessionId, page, referrer, timeOnPage, interacted, vitals, source, medium, campaign } = body;

        if (!sessionId || !page) return NextResponse.json({ ok: false }, { status: 400 });

        const ua = req.headers.get("user-agent") || "";
        const ip = getIp(req);

        if (type === "pageview") {
            const { isBot, reason } = detectBot(ua, null);

            await Session.findOneAndUpdate(
                { sessionId },
                {
                    $setOnInsert: {
                        startedAt: new Date(),
                        entryPage: page,
                        referrer:  referrer || "",
                        userAgent: ua,
                        ip,
                        source:    parseSource(referrer, source),
                        medium:    medium || "",
                        campaign:  campaign || "",
                        isBot,
                        botReason: reason,
                    },
                    $set:  { lastSeen: new Date() },
                    $push: { pages: page },
                },
                { upsert: true, new: true }
            );

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

            await Session.findOneAndUpdate(
                { sessionId },
                {
                    $set: { lastSeen: new Date(), exitPage: page, isBot, botReason: reason },
                    $inc: { totalTime: timeOnPage ?? 0 },
                }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[analytics/collect]", e.message);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
