import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PageView, Session, Conversion } from "@/models/Analytics";
import { LeadSequence, ContactMessage, EmailEvent } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.admin && token?.role !== "admin") {
        return NextResponse.json({ error: true }, { status: 403 });
    }

    const range = req.nextUrl.searchParams.get("range") || "7d";
    const now   = new Date();
    let since;
    if      (range === "1d")  since = new Date(now - 1  * 24 * 60 * 60 * 1000);
    else if (range === "30d") since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    else if (range === "90d") since = new Date(now - 90 * 24 * 60 * 60 * 1000);
    else                      since = new Date(now - 7  * 24 * 60 * 60 * 1000); // 7d default

    const noBackend  = { page: { $not: { $regex: "^/(api|admin)" } } };
    const matchAll   = { enteredAt: { $gte: since }, ...noBackend };
    const matchHuman = { enteredAt: { $gte: since }, isBot: false, ...noBackend };
    const matchBot   = { enteredAt: { $gte: since }, isBot: true,  ...noBackend };

    const [
        totalViews,
        humanViews,
        botViews,
        uniqueSessions,
        humanSessions,
        topPages,
        modeTimePerPage,
        topSources,
        vitalsPerPage,
        trafficByDay,
        botReasons,
        recentSessions,
    ] = await Promise.all([
        PageView.countDocuments(matchAll),
        PageView.countDocuments(matchHuman),
        PageView.countDocuments(matchBot),

        Session.countDocuments({ startedAt: { $gte: since } }),
        Session.countDocuments({ startedAt: { $gte: since }, isBot: false }),

        // Top pages by human views
        PageView.aggregate([
            { $match: matchHuman },
            { $group: {
                _id:     "$page",
                views:   { $sum: 1 },
                avgTime: { $avg: "$timeOnPage" },
                maxTime: { $max: "$timeOnPage" },
                minTime: { $min: { $cond: [{ $gt: ["$timeOnPage", 0] }, "$timeOnPage", null] } },
                exits:   { $sum: { $cond: [{ $gt: ["$timeOnPage", null] }, 1, 0] } },
            }},
            { $sort: { views: -1 } },
            { $limit: 15 },
        ]),

        // Mode time per page — bucket to 30s, pick most frequent bucket
        PageView.aggregate([
            { $match: { ...matchHuman, timeOnPage: { $gt: 0 } } },
            { $group: {
                _id: {
                    page:   "$page",
                    bucket: { $multiply: [{ $round: [{ $divide: ["$timeOnPage", 30] }, 0] }, 30] },
                },
                count: { $sum: 1 },
            }},
            { $sort: { count: -1 } },
            { $group: {
                _id:      "$_id.page",
                modeTime: { $first: "$_id.bucket" },
            }},
        ]),

        // Traffic sources
        Session.aggregate([
            { $match: { startedAt: { $gte: since }, isBot: false } },
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]),

        // Core Web Vitals per page (human only, vitals present)
        PageView.aggregate([
            { $match: { ...matchHuman, "vitals.lcp": { $gt: 0 } } },
            { $group: {
                _id:          "$page",
                lcp:          { $avg: "$vitals.lcp" },
                cls:          { $avg: "$vitals.cls" },
                ttfb:         { $avg: "$vitals.ttfb" },
                fcp:          { $avg: "$vitals.fcp" },
                inp:          { $avg: "$vitals.inp" },
                loadTime:     { $avg: "$vitals.loadTime" },
                sampleCount:  { $sum: 1 },
            }},
            { $sort: { sampleCount: -1 } },
            { $limit: 15 },
        ]),

        // Daily traffic (human views + sessions)
        PageView.aggregate([
            { $match: matchHuman },
            { $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$enteredAt" },
                },
                views: { $sum: 1 },
            }},
            { $sort: { _id: 1 } },
        ]),

        // Bot reason breakdown
        PageView.aggregate([
            { $match: matchBot },
            { $group: { _id: "$botReason", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),

        // Recent 20 human sessions with journey
        Session.find({ startedAt: { $gte: since }, isBot: false })
            .sort({ startedAt: -1 })
            .limit(20)
            .lean(),
    ]);

    // Avg time on page (human, where timeOnPage was recorded)
    const avgTimeResult = await PageView.aggregate([
        { $match: { ...matchHuman, timeOnPage: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$timeOnPage" } } },
    ]);
    const avgTimeOnPage = avgTimeResult[0]?.avg ?? 0;

    const avgPagesPerSession = humanSessions > 0
        ? (await Session.aggregate([
            { $match: { startedAt: { $gte: since }, isBot: false } },
            { $group: { _id: null, avg: { $avg: { $size: "$pages" } } } },
          ]))[0]?.avg ?? 0
        : 0;

    // Engagement / bounce rate — a session is "engaged" (not a bounce) if it had 2+ pageviews
    // or lasted 10+ seconds (GA4's definition). Bounce rate is the inverse. Humans only, no bots.
    const engagementAgg = await Session.aggregate([
        { $match: { startedAt: { $gte: since }, isBot: false } },
        { $group: {
            _id: null,
            total:   { $sum: 1 },
            engaged: { $sum: { $cond: [
                { $or: [
                    { $gte: [{ $size: "$pages" }, 2] },
                    { $gte: ["$totalTime", 10] },
                ] },
                1, 0,
            ] } },
        }},
    ]);
    const engTotal       = engagementAgg[0]?.total   ?? 0;
    const engEngaged     = engagementAgg[0]?.engaged ?? 0;
    const engagementRate = engTotal > 0 ? Math.round((engEngaged / engTotal) * 1000) / 10 : 0;
    const bounceRate     = engTotal > 0 ? Math.round(((engTotal - engEngaged) / engTotal) * 1000) / 10 : 0;

    const matchConversions = { occurredAt: { $gte: since } };
    const [totalConversions, conversionsBySource, conversionsByDay, blogViews, blogReads] = await Promise.all([
        Conversion.countDocuments(matchConversions),
        Conversion.aggregate([
            { $match: matchConversions },
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]),
        Conversion.aggregate([
            { $match: matchConversions },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),

        // Blog post views
        PageView.aggregate([
            { $match: { ...matchHuman, page: { $regex: "^/blog/." } } },
            { $group: { _id: "$page", views: { $sum: 1 }, avgTime: { $avg: "$timeOnPage" } } },
            { $sort: { views: -1 } },
            { $limit: 20 },
        ]),

        // Blog reads (scrolled to bottom + 30s)
        Conversion.aggregate([
            { $match: { ...matchConversions, conversionEvent: "blog_read" } },
            { $group: { _id: "$page", reads: { $sum: 1 } } },
        ]),
    ]);

    // ── Email stats (cumulative list counts + range-filtered engagement) ─────────
    const [
        totalEmailsCollected,
        activeEmails,
        optedOutEmails,
        emailOpens,
        emailClicks,
        uniqueOpeners,
        uniqueClickers,
        emailOpensByDay,
        emailClicksByDay,
    ] = await Promise.all([
        // Total unique emails ever collected (lead sequences + contact messages)
        LeadSequence.countDocuments({}),

        // Active — enrolled and not opted out
        LeadSequence.countDocuments({ unsubscribed: { $ne: true } }),

        // Opted out
        LeadSequence.countDocuments({ unsubscribed: true }),

        // Opens in range
        EmailEvent.countDocuments({ type: "email.opened", occurredAt: { $gte: since } }),

        // Clicks in range
        EmailEvent.countDocuments({ type: "email.clicked", occurredAt: { $gte: since } }),

        // Unique openers in range
        EmailEvent.distinct("email", { type: "email.opened", occurredAt: { $gte: since } }),

        // Unique clickers in range
        EmailEvent.distinct("email", { type: "email.clicked", occurredAt: { $gte: since } }),

        // Opens by day
        EmailEvent.aggregate([
            { $match: { type: "email.opened", occurredAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),

        // Clicks by day
        EmailEvent.aggregate([
            { $match: { type: "email.clicked", occurredAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
    ]);

    // Emails sent in range (delivered events)
    const emailsSentInRange = await EmailEvent.countDocuments({ type: "email.delivered", occurredAt: { $gte: since } });
    const openRate  = emailsSentInRange > 0 ? Math.round((uniqueOpeners.length  / emailsSentInRange) * 1000) / 10 : 0;
    const clickRate = emailsSentInRange > 0 ? Math.round((uniqueClickers.length / emailsSentInRange) * 1000) / 10 : 0;

    return NextResponse.json({
        error: false,
        range,
        since,
        summary: {
            totalViews,
            humanViews,
            botViews,
            botPercent: totalViews > 0 ? Math.round((botViews / totalViews) * 100) : 0,
            uniqueSessions,
            humanSessions,
            avgTimeOnPage:      Math.round(avgTimeOnPage),
            avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
            totalConversions,
            conversionRate: humanSessions > 0 ? Math.round((totalConversions / humanSessions) * 1000) / 10 : 0,
            bounceRate,
            engagementRate,
        },
        conversions: {
            total: totalConversions,
            bySource: conversionsBySource.map(c => ({ source: c._id || "direct", count: c.count })),
            byDay:    conversionsByDay.map(c => ({ date: c._id, count: c.count })),
        },
        topPages:       (() => {
            const modeMap = new Map(modeTimePerPage.map(m => [m._id, m.modeTime]));
            return topPages.map(p => ({
                page:     p._id,
                views:    p.views,
                avgTime:  Math.round(p.avgTime  ?? 0),
                maxTime:  Math.round(p.maxTime  ?? 0),
                minTime:  Math.round(p.minTime  ?? 0),
                modeTime: Math.round(modeMap.get(p._id) ?? 0),
            }));
        })(),
        topSources:     topSources.map(s => ({ source: s._id || "direct", count: s.count })),
        vitalsPerPage:  vitalsPerPage.map(v => ({
            page:        v._id,
            lcp:         Math.round(v.lcp ?? 0),
            cls:         Math.round((v.cls ?? 0) * 1000) / 1000,
            ttfb:        Math.round(v.ttfb ?? 0),
            fcp:         Math.round(v.fcp ?? 0),
            inp:         Math.round(v.inp ?? 0),
            loadTime:    Math.round(v.loadTime ?? 0),
            sampleCount: v.sampleCount,
        })),
        trafficByDay:   trafficByDay.map(d => ({ date: d._id, views: d.views })),
        botReasons:     botReasons.map(b => ({ reason: b._id || "unknown", count: b.count })),
        blogPosts: (() => {
            const readsMap = new Map(blogReads.map(r => [r._id, r.reads]));
            return blogViews.map(p => {
                const slug  = p._id.replace("/blog/", "");
                const reads = readsMap.get(p._id) ?? 0;
                return {
                    slug,
                    page:        p._id,
                    views:       p.views,
                    reads,
                    readRate:    p.views > 0 ? Math.round((reads / p.views) * 100) : 0,
                    avgTime:     Math.round(p.avgTime ?? 0),
                };
            }).sort((a, b) => b.reads - a.reads || b.views - a.views);
        })(),

        recentSessions: recentSessions.map(s => ({
            sessionId:  s.sessionId,
            startedAt:  s.startedAt,
            pages:      s.pages,
            totalTime:  s.totalTime,
            source:     s.source,
            entryPage:  s.entryPage,
            exitPage:   s.exitPage,
            referrer:   s.referrer,
        })),

        emailStats: {
            totalCollected: totalEmailsCollected,
            active:         activeEmails,
            optedOut:       optedOutEmails,
            sent:           emailsSentInRange,
            opens:          emailOpens,
            clicks:         emailClicks,
            uniqueOpens:    uniqueOpeners.length,
            uniqueClicks:   uniqueClickers.length,
            openRate,
            clickRate,
            opensByDay:  emailOpensByDay.map(d => ({ date: d._id, count: d.count })),
            clicksByDay: emailClicksByDay.map(d => ({ date: d._id, count: d.count })),
        },
    });
}
