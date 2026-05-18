import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PageView, Session } from "@/models/Analytics";

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

    const matchAll   = { enteredAt: { $gte: since } };
    const matchHuman = { enteredAt: { $gte: since }, isBot: false };
    const matchBot   = { enteredAt: { $gte: since }, isBot: true };

    const [
        totalViews,
        humanViews,
        botViews,
        uniqueSessions,
        humanSessions,
        topPages,
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
                _id: "$page",
                views:   { $sum: 1 },
                avgTime: { $avg: "$timeOnPage" },
                exits:   { $sum: { $cond: [{ $gt: ["$timeOnPage", null] }, 1, 0] } },
            }},
            { $sort: { views: -1 } },
            { $limit: 15 },
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
        },
        topPages:       topPages.map(p => ({ page: p._id, views: p.views, avgTime: Math.round(p.avgTime ?? 0) })),
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
    });
}
