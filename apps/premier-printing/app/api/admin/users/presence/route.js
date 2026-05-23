import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User, ActiveSession } from "@pythias/mongo";

const ONLINE_MS = 5 * 60 * 1000;

export async function GET(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.permissions?.charts) {
        return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
    }

    const since = new Date(Date.now() - ONLINE_MS);

    const [users, anonSessions] = await Promise.all([
        User.find({ lastSeen: { $gte: since } })
            .select("userName firstName lastName currentPage previousPage pageEnteredAt lastSeen role")
            .lean(),
        ActiveSession.find({ lastSeen: { $gte: since }, userName: { $exists: false } }).lean(),
    ]);

    // Convert staff users to the unified session shape
    const staffSessions = users.map(u => ({
        sessionId:   `staff-${u.userName}`,
        displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName,
        userName:    u.userName,
        role:        u.role,
        pages:       [u.previousPage, u.currentPage].filter(Boolean),
        entryPage:   u.currentPage,
        startedAt:   u.pageEnteredAt || u.lastSeen,
        lastSeen:    u.lastSeen,
        source:      "staff",
        isStaff:     true,
    }));

    // Anonymous sessions
    const anonFormatted = anonSessions.map(s => ({
        sessionId:  s.sessionId,
        displayName: null,
        userName:   null,
        pages:      s.pages || [],
        entryPage:  s.entryPage,
        startedAt:  s.startedAt,
        lastSeen:   s.lastSeen,
        source:     s.source || "direct",
        medium:     s.medium,
        campaign:   s.campaign,
        isStaff:    false,
    }));

    const sessions = [...staffSessions, ...anonFormatted]
        .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    return NextResponse.json({ error: false, sessions });
}
